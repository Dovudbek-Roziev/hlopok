// Avtomatik vazifalar / Scheduled tasks (node-cron)
const cron = require('node-cron');
const User = require('../models/User');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');
const { sendPushNotification } = require('./pushNotification');

const initCron = () => {
  // Har kuni soat 10:00 da bonus muddatini tekshirish
  cron.schedule('0 10 * * *', async () => {
    try {
      const settings = await BonusSettings.findOne() || { warningDays: 7 };
      const warningDays = settings.warningDays || 7;
      const warningDate = new Date(Date.now() + warningDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      // Muddati 7 kun ichida tugaydigan bonuslar — push yuborish
      const expiringSoon = await BonusTransaction.find({
        type: { $in: ['earned', 'admin_add'] },
        expiresAt: { $gte: now, $lte: warningDate },
      }).populate('user', 'firstName language bonusBalance pushToken');

      const notifiedUsers = new Set();
      const warnMessages = [];
      for (const tx of expiringSoon) {
        if (!tx.user || notifiedUsers.has(tx.user._id.toString())) continue;
        notifiedUsers.add(tx.user._id.toString());
        if (!tx.user.pushToken?.startsWith('ExponentPushToken')) continue;
        const isKy = tx.user.language === 'ky';
        warnMessages.push({
          to:    tx.user.pushToken,
          title: isKy ? 'Бонустар жакында өчөт!' : 'Бонусы скоро сгорят!',
          body:  isKy
            ? `${tx.user.bonusBalance} бонус ${warningDays} күндөн кийин өчөт. Эми колдонуңуз!`
            : `${tx.user.bonusBalance} бонусов сгорит через ${warningDays} дней. Используйте сейчас!`,
          data:  { screen: 'BonusCard' },
          sound: 'default',
        });
      }
      // Batch send (100 per request)
      for (let i = 0; i < warnMessages.length; i += 100) {
        try {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(warnMessages.slice(i, i + 100)),
          });
        } catch (err) {
          console.error('Cron push batch error:', err.message);
        }
      }

      // Muddati o'tgan bonuslarni o'chirish
      const expired = await BonusTransaction.find({
        type: { $in: ['earned', 'admin_add'] },
        expiresAt: { $lt: now },
      }).populate('user');

      for (const tx of expired) {
        if (!tx.user) continue;
        const user = await User.findById(tx.user._id);
        if (!user) continue;
        user.bonusBalance = Math.max(0, user.bonusBalance - tx.amount);
        await user.save();
        await BonusTransaction.create({
          user: user._id,
          type: 'expired',
          amount: tx.amount,
          description_ru: 'Бонус сгорел (истёк срок)',
          description_ky: 'Бонус өчтү (мөөнөтү бүттү)',
        });
        await BonusTransaction.findByIdAndDelete(tx._id);
      }

      if (notifiedUsers.size > 0 || expired.length > 0) {
        console.log(`Cron: ${notifiedUsers.size} push yuborildi, ${expired.length} bonus o'chirildi`);
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  console.log('✅ Cron tasks ishga tushdi / Cron tasks started');
};

module.exports = initCron;
