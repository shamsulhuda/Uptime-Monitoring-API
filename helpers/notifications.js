// Notifications library

// Dependencies
const https = require('https');
const querystring = require('querystring');
const { twilio } = require('./environments');

// Module Scaffolding
const notifications = {};

// Send SMS to user using twilio API

notifications.sendTwilioSms = (phone, msg, callback)=>{
    const userPhone = typeof(phone) === 'string' && phone.trim().length === 11 ? phone : false;
    const userMsg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600
        ? msg : false;

    if(userPhone && userMsg){
        // Request payload configuration
        const payload = {
            From: twilio.fromPhone,
            To: `+88${userPhone}`,
            Body: userMsg,
        };
        // stringify the payload
        const stringifyPayload = querystring.stringify(payload);
        // Configure the quest details
        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers:{
                'Content-Type':'application/x-www-form-urlencoded'
            },
        };
        //initiate the request
        const req = https.request(requestDetails, (res) => {
            // get sent request status
            const status = res.statusCode;
            // Final callback
            if(status === 200 || status === 201){
                callback(false);
            }else{
                callback(`Request failed, status code ${status}`);
            }
        });
        //Error handling
        req.on('error', (e)=>{
            callback(e);
        })
        req.write(stringifyPayload);
        req.end();
    }else{
        callback('Invalid request!')
    }
};

// Export the module

module.exports = notifications;