// Run manually after arranging a database backup. No writes without --apply-indexes.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const Product = require('../src/models/Product');
const Review = require('../src/models/Review');
const ReviewReport = require('../src/models/ReviewReport');
const RequestBudget = require('../src/models/RequestBudget');
const MediaCleanup = require('../src/models/MediaCleanup');
const { BonusTransaction } = require('../src/models/Bonus');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI must be configured locally');
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, autoCreate: false, maxPoolSize: 2 });
  const duplicatePhones = await User.aggregate([
    { $match: { phone: { $type: 'string', $gt: '' } } },
    { $group: { _id: '$phone', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }, { $count: 'count' },
  ]);
  // Never print phone numbers or database connection strings.
  const unsafeProducts = await Product.aggregate([
    { $project: { keys: { $map: { input: '$variants', as: 'v', in: { size: '$$v.size', color: { $ifNull: ['$$v.color', ''] } } } } } },
    { $match: { $expr: { $ne: [{ $size: '$keys' }, { $size: { $setUnion: ['$keys', []] } }] } } }, { $count: 'count' },
  ]);
  const counts = { duplicatePhoneGroups: duplicatePhones[0]?.count || 0, productsWithDuplicateVariants: unsafeProducts[0]?.count || 0 };
  console.log(counts);
  if (counts.duplicatePhoneGroups || counts.productsWithDuplicateVariants) throw new Error('Resolve duplicates manually before release; no records were removed');
  if (process.argv.includes('--apply-indexes')) {
    for (const model of [User, Order, Product, Review, ReviewReport, RequestBudget, MediaCleanup, BonusTransaction]) await model.createIndexes();
    console.log('Release indexes created. No existing indexes or documents were deleted.');
  } else console.log('Read-only checks finished. Indexes were not changed.');
}
main().catch(error => { console.error('Release check failed:', error.name); process.exitCode = 1; }).finally(() => mongoose.disconnect());
