const axios = require('axios');

const sendSMS = async (phone, message) => {
  const login    = process.env.NIKITA_LOGIN;
  const password = process.env.NIKITA_PASSWORD;
  const sender   = process.env.NIKITA_SENDER || 'HLOPOK';

  if (!login || !password) {
    // ENV vars sozlanmagan — konsolga chiqar (development)
    console.log(`\n[SMS-DEV] ${phone}: ${message}\n`);
    return;
  }

  await axios.post(
    'https://smspro.nikita.kg/api/message',
    {
      login,
      pwd:    password,
      id:     Date.now().toString(),
      sender,
      text:   message,
      phones: { phone },
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
  );
};

module.exports = { sendSMS };
