// server/config/twilio.js
const dotenv = require('dotenv');
dotenv.config();

let client = null;
let twilioEnabled = false;

// تعريف دالة sendSMS في البداية لمنع استخدام await في المستوى الأعلى
const sendSMS = async (to, body) => {
  if (!twilioEnabled) {
    console.log(`[SMS DISABLED] Would send to ${to}: ${body}`);
    return { disabled: true };
  }
  
  try {
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    
    console.log(`SMS sent with SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(`Error sending SMS: ${error.message}`);
    throw error;
  }
};

// التحقق من وجود بيانات Twilio وتهيئة العميل
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    twilioEnabled = true;
    console.log('Twilio initialized successfully');
  } catch (error) {
    console.error('Error initializing Twilio:', error.message);
  }
} else {
  console.log('Twilio credentials not found, SMS functionality disabled');
}

module.exports = { sendSMS, twilioEnabled };