const { Readable } = require("stream");
const cloudinary = require("cloudinary").v2;

function ensureCloudinaryConfigured() {
  const hasUrl = Boolean(process.env.CLOUDINARY_URL);
  const hasParts =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (!hasUrl && !hasParts) {
    throw new Error(
      "Cloudinary nao configurado. Defina CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET."
    );
  }

  if (!hasUrl && hasParts) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
}

async function saveUploadedImage(buffer, _originalname, mimetype) {
  ensureCloudinaryConfigured();

  if (!mimetype || !mimetype.startsWith("image/")) {
    throw new Error("Arquivo precisa ser uma imagem (JPEG, PNG, WebP, GIF, etc.).");
  }

  const folder = process.env.CLOUDINARY_FOLDER || "mercado-campolim";

  const uploaded = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });

  return {
    url: uploaded.secure_url,
    storage: "cloudinary",
    publicId: uploaded.public_id
  };
}

module.exports = {
  saveUploadedImage
};
