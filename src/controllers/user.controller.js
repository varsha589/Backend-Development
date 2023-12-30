import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/apiError.js';
import {User} from '../models/user.models.js';
import {ApiResponse} from '../utils/apiResponse.js'
import {cloudinaryUploader} from '../utils/cloudinary.service.js'

 
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




export {registerUser}