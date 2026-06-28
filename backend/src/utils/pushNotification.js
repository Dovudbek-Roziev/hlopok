// Expo Push Notification yuborish yordamchisi
// Expo Push Notification helper — https://exp.host/--/api/v2/push/send

const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!token || !token.startsWith('ExponentPushToken')) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        to:    token,
        title,
        body,
        data,
        sound:    'default',
        priority: 'high',
      }),
    });
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
};

// Foydalanuvchiga buyurtma holati o'zgarganda xabar yuborish
const ORDER_STATUS_MSGS = {
  confirmed: {
    ru: 'Заказ подтверждён',
    ky: 'Буйрутма тастыкталды',
    body_ru: 'Ваш заказ принят в обработку!',
    body_ky: 'Буйрутмаңыз иштетилүүгө кабыл алынды!',
  },
  preparing: {
    ru: 'Заказ готовится',
    ky: 'Буйрутма даярдалууда',
    body_ru: 'Мы собираем ваш заказ.',
    body_ky: 'Буйрутмаңызды чогултуп жатабыз.',
  },
  ready: {
    ru: 'Заказ готов! 🎉',
    ky: 'Буйрутма даяр! 🎉',
    body_ru: 'Ваш заказ готов к выдаче. Ждём вас!',
    body_ky: 'Буйрутмаңыз берүүгө даяр. Сизди күтөбүз!',
  },
  cancelled: {
    ru: 'Заказ отменён',
    ky: 'Буйрутма жокко чыгарылды',
    body_ru: 'К сожалению, ваш заказ был отменён.',
    body_ky: 'Тилекке каршы, буйрутмаңыз жокко чыгарылды.',
  },
};

const sendOrderStatusPush = async ({ pushToken, userLang = 'ru', status, orderNumber, orderId }) => {
  const msgs = ORDER_STATUS_MSGS[status];
  if (!msgs || !pushToken) return;
  const lang = userLang === 'ky' ? 'ky' : 'ru';
  await sendPushNotification({
    token: pushToken,
    title: `${msgs[lang]} — #${orderNumber}`,
    body:  msgs[`body_${lang}`],
    data:  { screen: 'OrderDetail', orderId, orderNumber },
  });
};

module.exports = { sendPushNotification, sendOrderStatusPush };
