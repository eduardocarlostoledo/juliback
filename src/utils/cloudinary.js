const { v2 } = require("cloudinary");

v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const TRANSIENT_HTTP_CODES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_UPLOAD_RETRIES = 3;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isTransientCloudinaryError = (error) => {
  const httpCode = Number(error?.http_code || error?.statusCode || error?.status);
  return TRANSIENT_HTTP_CODES.has(httpCode);
};

const uploadImage = async (filePath, attempt = 1) => {
  try {
    return await v2.uploader.upload(filePath, {
      folder: "Products",
      resource_type: "image",
    });
  } catch (error) {
    if (attempt < MAX_UPLOAD_RETRIES && isTransientCloudinaryError(error)) {
      const retryDelay = 400 * attempt;
      console.warn(
        `Cloudinary upload failed with ${error?.http_code || error?.status || "unknown"} on attempt ${attempt}. Retrying in ${retryDelay}ms...`
      );
      await wait(retryDelay);
      return uploadImage(filePath, attempt + 1);
    }

    throw error;
  }
};

const uploadImages = async (filePaths = []) => {
  const uploads = [];

  for (const filePath of filePaths) {
    uploads.push(await uploadImage(filePath));
  }

  return uploads;
};

const deleteImage = async (id) => {
  return await v2.uploader.destroy(id);
};

module.exports = { uploadImage, uploadImages, deleteImage };
