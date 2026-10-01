const axios = require('axios');
const { sendSMS } = require('../utils/sms');

const generateOtpMessage = (lang, code) => {
    if (lang === 'ky' || lang === 'kg') {
        return `Hlopok үчүн тастыктоо кодуңуз: ${code}`;
    }
    return `Ваш код подтверждения для Hlopok: ${code}`;
};

const sendWhatsAppOTP = async (phone, message) => {
    try {
        const instanceId = process.env.GREEN_API_INSTANCE;
        const token = process.env.GREEN_API_TOKEN;
        
        // Agar ENV lar ulanmagan bo'lsa, konsolga chiqaradi (dev rejimi)
        if (!instanceId || !token) {
            console.log(`\n[WHATSAPP-DEV] ${phone}: ${message}\n`);
            return true;
        }
        
        const cleanPhone = phone.replace(/\D/g, ''); 
        // 0 bilan boshlansa 996 ga o'girish logikasi (agar kerak bo'lsa)
        let formattedPhone = cleanPhone;
        if (formattedPhone.startsWith('0')) {
            formattedPhone = `996${formattedPhone.slice(1)}`;
        }
        const chatId = `${formattedPhone}@c.us`; 
        
        const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;
        
        const response = await axios.post(url, { chatId, message });
        console.log("WhatsApp orqali kod yuborildi:", response.data);
        return true;
    } catch (error) {
        console.error("WhatsApp'ga yuborishda xatolik:", error?.response?.data || error.message);
        throw new Error("WhatsApp_API_ERROR");
    }
};

const handleOtpSending = async (phone, type, lang, code) => {
    const message = generateOtpMessage(lang, code);
    
    // Nikita.kg uchun +996 format
    const clean = phone.replace(/\D/g, '');
    let intlPhone = clean;
    if (clean.length === 10 && clean.startsWith('0')) {
        intlPhone = `+996${clean.slice(1)}`;
    } else if (!clean.startsWith('+')) {
        intlPhone = `+${clean}`;
    }

    if (type === 'WHATSAPP') {
        await sendWhatsAppOTP(phone, message);
    } else {
        try {
            await sendSMS(intlPhone, message);
        } catch (smsError) {
            console.log("SMS jo'natib bo'lmadi, avtomatik ravishda WhatsApp'ga o'tilmoqda...");
            await sendWhatsAppOTP(phone, message); 
        }
    }
};

module.exports = {
    generateOtpMessage,
    sendWhatsAppOTP,
    handleOtpSending
};
