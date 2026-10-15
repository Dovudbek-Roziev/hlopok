const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Order    = require('../models/Order');
const msg      = require('../utils/msg');
const User = require('../models/User');
const ReviewReport = require('../models/ReviewReport');

// GET /products/:id/reviews — barcha ommaviy, auth yo'q
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const skip  = (page - 1) * limit;

    // avgRating va count — barcha reviewlardan (limitdan mustaqil)
    const filter = { product: new mongoose.Types.ObjectId(productId), approved: true };
    if (req.user?.blockedUsers?.length) filter.user = { $nin: req.user.blockedUsers };
    const [aggResult, reviews] = await Promise.all([
      Review.aggregate([
        { $match: filter },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Review.find(filter)
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const count     = aggResult[0]?.count || 0;
    const avgRating = count > 0 ? Math.round((aggResult[0].avg) * 10) / 10 : 0;

    res.json({ success: true, reviews, avgRating, count, page, pages: Math.ceil(count / limit) });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка сервера', 'Сервер катасы') });
  }
};

// GET /products/:id/reviews/can — faqat autentifikatsiya qilinganlar
exports.canReview = async (req, res) => {
  try {
    const existing = await Review.findOne({ user: req.user._id, product: req.params.id })
      .populate('user', 'firstName lastName');
    if (existing) return res.json({ success: true, canReview: false, userReview: existing });

    const order = await Order.findOne({
      user:           req.user._id,
      status:         'ready',
      'items.product': req.params.id,
    });

    res.json({ success: true, canReview: !!order, userReview: null });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};

// POST /products/:id/reviews — faqat xarid qilganlar
exports.createReview = async (req, res) => {
  try {
    const { rating, comment, acceptRules } = req.body || {};
    if (acceptRules !== true || (comment != null && typeof comment !== 'string')) return res.status(400).json({ success: false, message: msg(req, 'Примите правила отзывов', 'Пикир жазуу эрежелерин кабыл алыңыз') });
    const productId = req.params.id;

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ success: false, message: msg(req, 'Оценка от 1 до 5', 'Баа 1 ден 5 ке чейин') });
    }

    const order = await Order.findOne({
      user:           req.user._id,
      status:         'ready',
      'items.product': productId,
    });
    if (!order) {
      return res.status(403).json({
        success: false,
        message: msg(req, 'Отзыв можно оставить только после получения заказа', 'Буйрутманы алгандан кийин гана пикир калтырса болот'),
      });
    }

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, product: productId },
      { rating: parsedRating, comment: (comment || '').slice(0, 300).trim(), approved: false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await review.populate('user', 'firstName lastName');

    res.status(201).json({ success: true, review });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};

// DELETE /products/:id/reviews/:reviewId — faqat admin
exports.deleteReview = async (req, res) => {
  try {
    const deleted = await Review.findOneAndDelete({ _id: req.params.reviewId, product: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: msg(req, 'Отзыв не найден', 'Пикир табылган жок') });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};


exports.reportReview = async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, product: req.params.id, approved: true });
    if (!review) return res.status(404).json({ success: false });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : '';
    await ReviewReport.updateOne({ review: review._id, reporter: req.user._id }, { $set: { author: review.user, reason, resolved: false } }, { upsert: true });
    res.json({ success: true });
  } catch (error) { res.status(error.code === 11000 ? 409 : 500).json({ success: false }); }
};

exports.setBlock = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId) || String(req.user._id) === req.params.userId || typeof req.body?.blocked !== 'boolean') return res.status(400).json({ success: false });
    await User.updateOne({ _id: req.user._id }, req.body.blocked ? { $addToSet: { blockedUsers: req.params.userId } } : { $pull: { blockedUsers: req.params.userId } });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
};
exports.getBlocks = async (req, res) => {
  const user = await User.findById(req.user._id).populate('blockedUsers', 'firstName lastName');
  res.json({ success: true, users: user?.blockedUsers || [] });
};
exports.getModeration = async (req, res) => {
  try {
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1));
    const filter = req.query.status === 'approved' ? { approved: true } : { approved: { $ne: true } };
    const [reviews, total, reports] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * 30).limit(30).populate('user', 'firstName lastName').populate('product', 'name_ru name_ky'),
      Review.countDocuments(filter),
      ReviewReport.find({ resolved: false }).sort({ createdAt: -1 }).limit(100).populate('review'),
    ]);
    res.json({ success: true, reviews, reports, pagination: { page, pages: Math.ceil(total / 30), total } });
  } catch { res.status(500).json({ success: false }); }
};
exports.moderate = async (req, res) => {
  try {
    if (typeof req.body?.approved !== 'boolean') return res.status(400).json({ success: false });
    const review = await Review.findByIdAndUpdate(req.params.reviewId, { $set: { approved: req.body.approved } }, { new: true });
    if (!review) return res.status(404).json({ success: false });
    await ReviewReport.updateMany({ review: review._id }, { $set: { resolved: true } });
    res.json({ success: true, review });
  } catch { res.status(500).json({ success: false }); }
};
