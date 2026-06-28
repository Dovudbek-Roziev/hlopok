require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔌 MongoDB ulandi');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@hlopok.com';
  const result = await User.deleteMany({ role: { $ne: 'admin' } });
  console.log(`🗑️  ${result.deletedCount} ta foydalanuvchi o'chirildi`);
  console.log(`✅ Admin (${adminEmail}) saqlab qolindi`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
