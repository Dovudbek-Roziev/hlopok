const languageMiddleware = (req, res, next) => {
  const lang = req.headers['accept-language'];
  req.lang = lang && lang.startsWith('ky') ? 'ky' : 'ru';
  next();
};

module.exports = languageMiddleware;
