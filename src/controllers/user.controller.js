import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js';
import {User } from '../models/user.models.js';
import {ApiResponse} from '../utils/apiResponse.js'
import {cloudinaryUploader} from '../utils/cloudinary.service.js'
import jwt from 'jasonwebtoken'


const generateAccessAndRefereshTokens = async(userId) =>{
   try {
       const user = await User.findById(userId)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({ validateBeforeSave: false })

       return {accessToken, refreshToken}


   } catch (error) {
       throw new ApiError(500, "Something went wrong while generating referesh and access token")
   }
}


 
const registerUser = asyncHandler(
   async (req, res) =>{
        const  {username,fullname,email,password} =  req.body

        if( [username,fullname,email,password].some((feilds) => 
            feilds?.trim() == " ") ){
               throw ApiError(409," Please fill the required Feilds !")
            }
            
   const existedUser = await User.findOne({
   $or: [{username},{email}]
   })

   if(existedUser){
      throw ApiError(409,"User is already registered")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   if(!avatarLocalPath){
      throw ApiError(409,"avatar is required")
   }

   const avatar = await cloudinaryUploader(avatarLocalPath)
   const coverImage = await cloudinaryUploader( coverImageLocalPath)

   if(!avatar){
      throw ApiError(409,"avatar is required")
   }

   const user = await User.create({
      username : username.trim().toLowerCase(),
      fullname,
      email,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      password
   }) 

   const createdUser = User.findById(user._id).select(
      "-password -refreshToken"
   )


   if(!createdUser){
      throw ApiError(500,"something went wrong in registering user!")
   }

   res.status(200).json(
     new ApiResponse( 209 , "User is Registerd successfully!!")
   )

}
)

const loginUser = asyncHandler( 
   async (req,res) => {
      const {username , email , password } = req.body ;

      if( !(username || email)){
         throw ApiError(409,"Please Enter Username or Password")
      }

      const user = await User.findOne({
         $or : [{ username } , { email }]
      })

      if(!user){
         throw ApiError(409,"User is not Registered !!") 
      }

      const isPasswordValid = await user.isPasswordCorrect(password)
      if(!isPasswordValid){
         throw ApiError(409,"Password Incorrect!")
      }

      const {AccessToken,RefreshToken} = await generateAccessAndRefereshTokens(user._Id)

      const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

      const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", AccessToken, options)
    .cookie("refreshToken", RefreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, AccessToken, RefreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler( async (req,res)=>{
   await User.findByIdAndUpdate(
      req.user._id,
      {
          $set: {
              refreshToken: undefined
          }
      },
      {
          new: true
      }
  )

  const options = {
      httpOnly: true,
      secure: true
  }

  return res
  .status(200)
  .clearCookie("AccessToken", options)
  .clearCookie("RefreshToken", options)
  .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
       throw new ApiError(401, "unauthorized request")
   }

   try {
       const decodedToken = jwt.verify(
           incomingRefreshToken,
           process.env.REFRESH_TOKEN_SECRET
       )
   
       const user = await User.findById(decodedToken?._id)
   
       if (!user) {
           throw new ApiError(401, "Invalid refresh token")
       }
   
       if (incomingRefreshToken !== user?.refreshToken) {
           throw new ApiError(401, "Refresh token is expired or used")
           
       }
   
       const options = {
           httpOnly: true,
           secure: true
       }
   
       const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
   
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json(
           new ApiResponse(
               200, 
               {accessToken, refreshToken: newRefreshToken},
               "Access token refreshed"
           )
       )
   } catch (error) {
       throw new ApiError(401, error?.message || "Invalid refresh token")
   }

})













export {registerUser,
      loginUser,
      logoutUser,
      refreshAccessToken
}