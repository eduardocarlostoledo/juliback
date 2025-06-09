const {v2}=require('cloudinary');

const uploadImage= async(filePath)=>{
    return await v2.uploader.upload(filePath,{
        //nombre de la carpeta en cloudinary
        folder : 'Products'
    })
}

const deleteImage= async(id)=>{
    return await v2.uploader.destroy(id)
}

v2.config({
    cloud_name: "dgvrqx1ca",
    api_key: "211176113828956",
    api_secret: "UxjYWjLd2p-fZm1Tw-kqDRCAxW4",
    secure:true
})


module.exports={uploadImage,deleteImage}