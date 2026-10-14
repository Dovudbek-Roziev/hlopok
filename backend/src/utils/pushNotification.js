// Expo accepts a notification ticket here; final device delivery is checked on the device.
const sendPushNotification = async ({ token, title, body, data = {} }) => {
  if (!/^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/.test(token || '')) return false;
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default', priority: 'high', channelId: 'orders' }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.data?.status !== 'ok') {
      console.error('Push notification rejected:', response.status, result);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Push notification error:', error.message);
    return false;
  }
};

const ORDER_STATUS_MSGS = {
  confirmed: {
    ru: ['Заказ подтверждён', 'Ваш заказ принят в обработку.'],
    ky: ['Буйрутма ырасталды', 'Буйрутмаңыз кабыл алынды.'],
  },
  preparing: {
    ru: ['Заказ готовится', 'Мы собираем ваш заказ.'],
    ky: ['Буйрутма даярдалууда', 'Буйрутмаңызды даярдап жатабыз.'],
  },
  ready: {
    ru: ['Заказ готов', 'Ваш заказ готов к выдаче. Ждём вас!'],
    ky: ['Буйрутма даяр', 'Буйрутмаңыз даяр. Сизди күтөбүз!'],
  },
  cancelled: {
    ru: ['Заказ отменён', 'Ваш заказ отменён.'],
    ky: ['Буйрутма жокко чыгарылды', 'Буйрутмаңыз жокко чыгарылды.'],
  },
};

const sendOrderStatusPush = async ({ pushToken, userLang = 'ru', status, orderNumber, orderId }) => {
  const messages = ORDER_STATUS_MSGS[status];
  if (!messages) return 0;
  const [title, body] = messages[userLang === 'ky' ? 'ky' : 'ru'];
  const tokens = [...new Set((Array.isArray(pushToken) ? pushToken : [pushToken]).filter(Boolean))];
  const accepted = await Promise.all(tokens.map(token => sendPushNotification({
    token, title: `${title} #${orderNumber}`, body,
    data: { screen: 'OrderDetail', orderId, orderNumber },
  })));
  return accepted.filter(Boolean).length;
};

module.exports = { sendPushNotification, sendOrderStatusPush };
