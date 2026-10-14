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
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'res.cloudinary.com') return null;
    const uploadPath = parsed.pathname.split('/upload/')[1];
    if (!uploadPath) return null;
    const segments = uploadPath.split('/');
    const versionIndex = segments.findIndex(segment => /^v\d+$/.test(segment));
    if (versionIndex < 0) return null;
    const publicId = segments.slice(versionIndex + 1).join('/');
    return publicId.replace(/\.[^/.]+$/, '') || null;
  } catch {
    return null;
  }
};

module.exports = { cloudinary, deleteImage, getPublicId };
