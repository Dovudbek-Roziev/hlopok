// Cloudinary xizmati / Cloudinary service
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Rasm o'chirish / Delete image
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

// Public ID ni URL dan olish / Extract public ID from URL
const getPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
};

module.exports = { cloudinary, deleteImage, getPublicId };
