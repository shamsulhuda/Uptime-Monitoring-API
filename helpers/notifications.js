// Notifications library

// Dependencies
const https = require('https');

// Module Scaffolding
const notifications = {};

// Send SMS to user using twilio API

notifications.sendTwilioSms = (phone, msg, callback)=>{
    const userPhone = typeof(phone) === 'string' && phone.trim().length === 11 ? phone : false;
    const userMsg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600
        ? msg : false;
};

// Export the module

module.exports = notifications;