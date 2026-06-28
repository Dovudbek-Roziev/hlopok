// Ikki tilli xabar / Bilingual message helper
const msg = (req, ru, ky) => req.lang === 'ky' ? ky : ru;
module.exports = msg;
