// Daily account-wide bonus expiry and notification jobs.
const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../models/User');
const { BonusTransaction, BonusSettings } = require('../models/Bonus');

const isExpoToken = token => /^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/.test(token || '');

async function expireAccount(userId, now) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findOne({
        _id: userId,
        bonusExpiresAt: { $lte: now },
        bonusExpiryProcessedAt: { $exists: false },
      }).session(session);
      if (!user) return;
      const amount = user.bonusBalance;
      user.bonusBalance = 0;
      user.bonusExpiryProcessedAt = now;
      await user.save({ session });
      if (amount > 0) await BonusTransaction.create([{
        user: user._id, type: 'expired', amount,
        description_ru: 'Срок действия бонусов истёк',
        description_ky: 'Бонустардын мөөнөтү бүттү',
      }], { session });
    });
  } finally {
    await session.endSession();
  }
}

const initCron = () => {
  cron.schedule('0 10 * * *', async () => {
    try {
      const settings = await BonusSettings.findOne();
      const warningDays = settings?.warningDays ?? 7;
      const expiryDays = settings?.expiryDays ?? 90;
      const now = new Date();
      const warningDate = new Date(now.getTime() + warningDays * 86400000);

      const legacyUsers = await User.find({ bonusExpiresAt: { $exists: false } })
        .select('_id createdAt').limit(500);
      for (const user of legacyUsers) {
        const expiresAt = new Date(user.createdAt.getTime() + expiryDays * 86400000);
        await User.updateOne(
          { _id: user._id, bonusExpiresAt: { $exists: false } },
          { $set: { bonusExpiresAt: expiresAt } }
        );
        await BonusTransaction.updateMany(
          { user: user._id, type: { $in: ['earned', 'admin_add'] } },
          { $set: { expiresAt } }
        );
      }

      const acceptedUsers = new Set();
      let batch = [];
      const flush = async () => {
        if (!batch.length) return;
        const current = batch;
        batch = [];
        try {
          const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(current.map(item => item.message)),
          });
          const result = await response.json().catch(() => null);
          if (!response.ok || !Array.isArray(result?.data)) {
            console.error('Bonus warning push rejected:', response.status, result);
            return;
          }
          result.data.forEach((ticket, index) => {
            if (ticket?.status === 'ok' && current[index]) acceptedUsers.add(current[index].userId);
          });
        } catch (error) {
          console.error('Bonus warning push error:', error.message);
        }
      };

      for await (const user of User.find({
        isActive: true,
        bonusBalance: { $gt: 0 },
        bonusExpiresAt: { $gte: now, $lte: warningDate },
        bonusExpiryWarningSentAt: { $exists: false },
      }).select('_id language bonusBalance pushToken pushTokens').cursor()) {
        const tokens = [...new Set([...(user.pushTokens || []), user.pushToken].filter(isExpoToken))];
        const isKy = user.language === 'ky';
        for (const token of tokens) {
          batch.push({
            userId: user._id.toString(),
            message: {
              to: token,
              title: isKy ? 'Бонустардын мөөнөтү бүтөт' : 'Срок бонусов скоро истечёт',
              body: isKy
                ? `${user.bonusBalance} бонус ${warningDays} күн ичинде өчөт. Колдонуп калыңыз!`
                : `${user.bonusBalance} бонусов сгорит через ${warningDays} дней. Используйте сейчас!`,
              data: { screen: 'BonusCard' },
              sound: 'default',
              channelId: 'orders',
            },
          });
          if (batch.length === 100) await flush();
        }
      }
      await flush();
      if (acceptedUsers.size) {
        await User.updateMany(
          { _id: { $in: [...acceptedUsers] }, bonusExpiryWarningSentAt: { $exists: false } },
          { $set: { bonusExpiryWarningSentAt: now } }
        );
      }

      let expiredCount = 0;
      for await (const user of User.find({
        bonusExpiresAt: { $lte: now },
        bonusExpiryProcessedAt: { $exists: false },
      }).select('_id').cursor()) {
        await expireAccount(user._id, now);
        expiredCount++;
      }
      if (acceptedUsers.size || expiredCount) {
        console.log(`Cron: ${acceptedUsers.size} bonus warnings accepted, ${expiredCount} accounts expired`);
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });
};

module.exports = initCron;
