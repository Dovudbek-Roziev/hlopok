const mongoose = require('mongoose');
const Review   = require('../models/Review');
const Order    = require('../models/Order');
const msg      = require('../utils/msg');

// GET /products/:id/reviews — barcha ommaviy, auth yo'q
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const page  = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const skip  = (page - 1) * limit;

    // avgRating va count — barcha reviewlardan (limitdan mustaqil)
    const [aggResult, reviews] = await Promise.all([
      Review.aggregate([
        { $match: { product: new mongoose.Types.ObjectId(productId) } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Review.find({ product: productId })
        .populate('user', 'firstName lastName avatar')
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
      .populate('user', 'firstName lastName avatar');
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
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
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
      { rating: parsedRating, comment: (comment || '').slice(0, 300).trim() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await review.populate('user', 'firstName lastName avatar');

    res.status(201).json({ success: true, review });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};

// DELETE /products/:id/reviews/:reviewId — faqat admin
exports.deleteReview = async (req, res) => {
  try {
    const deleted = await Review.findByIdAndDelete(req.params.reviewId);
    if (!deleted) return res.status(404).json({ success: false, message: msg(req, 'Отзыв не найден', 'Пикир табылган жок') });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: msg(req, 'Ошибка', 'Ката') });
  }
};
