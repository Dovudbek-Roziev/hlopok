const { cloudinary } = require('../services/cloudinaryService');

// Rasm yuklash / Upload image (preset cheklovlariga tegmaslik uchun yuklash parametrlarisiz)
// Upload without extra params, so the unsigned upload preset never rejects the request
const uploadToCloudinary = async (buffer, mimetype, folder) => {
  const b64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.unsigned_upload(b64, 'hlopok', { folder });
  return addCompression(result.secure_url);
};

// Yetkazib berish URL'iga siqish qo'shish / Add compression via delivery URL
// quality: auto:good — sifatni sezilarli pasaytirmasdan hajmni kamaytiradi
// w_1600,h_1600,c_limit — faqat juda katta rasmlarni kichraytiradi, kichigini kattalashtirmaydi
const addCompression = (url) => {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/q_auto:good,f_auto,w_1600,h_1600,c_limit/');
};

module.exports = { uploadToCloudinary };
