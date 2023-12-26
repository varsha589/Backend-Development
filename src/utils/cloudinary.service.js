import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
          

          
cloudinary.config({ 
  cloud_name:CLOUDINARY_CLOUD_NAME , 
  api_key: CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET
});

const cloudinaryUploader = async(localFilePath) =>{
    try {
        if(!localPath) return null

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        fs.unlink(localFilePath)
        return response
        
    } catch (error) {
        fs.unlink(localFilePath)
        console.log("error occured while uploading " , error)
        return null
    }
}

export {cloudinaryUploader}



