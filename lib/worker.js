// Title:: workers library //

// Dependencies
const url = require('url');
const http = require('http');
const https = require('https');
const data = require('./data');
const { parseJSON } = require('../helpers/utilities');
const { sendTwilioSms } = require('../helpers/notifications');

// worker object - module scaffolding
const worker = {};

// lookup all the checks
worker.gatherAllchecks = () => {
    data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                // read the check data
                data.read('checks', check, (err1, originalCheckData) => {
                    if (!err1 && originalCheckData) {
                        // pass the data to next process
                        worker.validateCheckData(parseJSON(originalCheckData));
                    } else {
                        console.log('Error:: reading one of the checks data!');
                    }
                });
            });
        } else {
            console.log('Status: Could not found any checks to process!');
        }
    });
};

// validate indivisual check data
worker.validateCheckData = (originalCheckData) => {
    const originalData = originalCheckData;
    if (originalCheckData && originalCheckData.id) {
        originalData.state = typeof (originalCheckData.state) === 'string'
            && ['up', 'down'].indexOf(originalCheckData.state) > -1
                ? originalCheckData.state : 'down';

                originalData.lastChecked = typeof (originalCheckData.lastChecked) === 'number'
            && originalCheckData.lastChecked > 0
                ? originalCheckData.lastChecked
                : false;
        worker.performCheck(originalData);
    } else {
        console.log('Invalid data');
    }
};

// perform check
worker.performCheck = (originalCheckData) => {
    // prepare the initial check outcome
    let checkOutCome = {
        error: false,
        responseCode: false,
    };
    // mark the outcome hasn't been set
    let outcomeSent = false;

    // parse the hostname & full url from original data
    const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
    const { hostname } = parsedUrl;
    const { path } = parsedUrl;

    // construct the request
    const requestDetails = {
        protocol: `${originalCheckData.protocol}:`,
        hostname,
        method: originalCheckData.method.toUpperCase(),
        path,
        timeout: originalCheckData.timeoutSeconds * 1000,
    };

    const protocolToUse = originalCheckData.protocol === 'http' ? http : https;
    const req = protocolToUse.request(requestDetails, (res) => {
        // Get status code
        const status = res.statusCode;
        // update the check outcome and pass to the next process
        checkOutCome.responseCode = status;
        if (!outcomeSent) {
            worker.processCheckOutCome(originalCheckData, checkOutCome);
            outcomeSent = true;
        }
    });
    req.on('error', (e) => {
        checkOutCome = {
            error: true,
            value: e,
        };
        if (!outcomeSent) {
            worker.processCheckOutCome(originalCheckData, checkOutCome);
            outcomeSent = true;
        }
    });
    req.on('timeout', () => {
        checkOutCome = {
            error: true,
            value: 'timeout',
        };
        if (!outcomeSent) {
            worker.processCheckOutCome(originalCheckData, checkOutCome);
            outcomeSent = true;
        }
    });
    // req send
    req.end();
};

worker.processCheckOutCome = (originalCheckData, checkOutCome) => {
    // Check if check outcome is up/down
    const state = !checkOutCome.error
        && checkOutCome.responseCode
        && originalCheckData.successCodes.indexOf(checkOutCome.responseCode) > -1
            ? 'up'
            : 'down';

    // Alert setup for user
    const setAlert = !!(originalCheckData.lastChecked && originalCheckData.state !== state);

    // update check data
    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // update the check disk
    data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (setAlert) {
                worker.alertUserToStatusChange(newCheckData);
            } else {
                console.log('No state change!');
            }
        } else {
            console.log('Error: trying to save check data of one of the checks!');
        }
    });
};

// Send notification sms to user if state change
worker.alertUserToStatusChange = (newCheckData) => {
    const msg = `Alert: your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;
    sendTwilioSms(newCheckData.userPhone, msg, (err) => {
        console.log(newCheckData.userPhone, msg);
        if (!err) {
            console.log(`SMS Sent success: ${msg}`);
        } else {
            console.log('Woops! Something is wrong to send SMS!', err);
        }
    });
};
worker.loop = () => {
    setInterval(() => {
        worker.gatherAllchecks();
    }, 1000 * 60);
};
// Start workers
worker.init = () => {
    // Execute all checks
    worker.gatherAllchecks();

    // call the for check
    worker.loop();
};

module.exports = worker;
