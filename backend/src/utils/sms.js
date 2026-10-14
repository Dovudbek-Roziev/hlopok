const axios = require('axios');
const crypto = require('crypto');

const escapeXml = value => String(value).replace(/[<>&'\"]/g, character => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '\"': '&quot;',
})[character]);

const sendSMS = async (phone, message) => {
  const login = process.env.NIKITA_LOGIN;
  const password = process.env.NIKITA_PASSWORD;
  const sender = process.env.NIKITA_SENDER;
  if (!login || !password || !sender) {
    const error = new Error('Nikita credentials are not configured');
    error.code = 'NIKITA_NOT_CONFIGURED';
    throw error;
  }

  const normalizedPhone = String(phone).replace(/\D/g, '');
  if (!/^996\d{9}$/.test(normalizedPhone)) {
    const error = new Error('Invalid recipient phone');
    error.code = 'NIKITA_INVALID_PHONE';
    throw error;
  }

  const requestId = crypto.randomBytes(6).toString('hex');
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<message>',
    `<login>${escapeXml(login)}</login>`,
    `<pwd>${escapeXml(password)}</pwd>`,
    `<id>${requestId}</id>`,
    `<sender>${escapeXml(sender)}</sender>`,
    `<text>${escapeXml(message)}</text>`,
    '<phones>',
    `<phone>${normalizedPhone}</phone>`,
    '</phones>',
    '</message>',
  ].join('');

  const response = await axios.post('https://smspro.nikita.kg/api/message', xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    timeout: 10000,
    responseType: 'text',
  });
  const status = response.data?.match(/<status>\s*(\d+)\s*<\/status>/i)?.[1];
  if (status !== '0') {
    const error = new Error('Nikita did not accept the OTP request');
    error.code = status ? `NIKITA_STATUS_${status}` : 'NIKITA_INVALID_RESPONSE';
    throw error;
  }

  return { accepted: true, requestId };
};

module.exports = { sendSMS };
