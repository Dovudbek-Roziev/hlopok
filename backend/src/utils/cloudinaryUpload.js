const { cloudinary } = require('../services/cloudinaryService');
const { Readable } = require('stream');
const sharp = require('sharp');

const isSupportedImage = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;
  if (mimetype === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/webp') {
    return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
};

const uploadToCloudinary = async (buffer, mimetype, folder) => {
  if (!isSupportedImage(buffer, mimetype)) {
    throw Object.assign(new Error('Invalid image file'), { statusCode: 400 });
  }
  let decoded;
  try {
    decoded = await sharp(buffer, { limitInputPixels: 25000000, animated: false })
      .rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 }).toBuffer();
  } catch { throw Object.assign(new Error('Invalid image file'), { statusCode: 400 }); }
  const result = await new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, response) => error ? reject(error) : resolve(response)
    );
    Readable.from(decoded).pipe(upload);
  });
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
