// Check Handler

const data = require('../../lib/data');
const { hash } = require('../../helpers/utilities');
const { parseJSON, createRandomString } = require('../../helpers/utilities');
const { check, user } = require('../../routes');
const tokenHandler = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');

// module scaffolding
const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._check = {};

handler._check.post = (requestProperties, callback) => {
    const protocol = typeof (requestProperties.body.protocol) === 'string'
    && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
        ? requestProperties.body.protocol
        : false;
    const url = typeof (requestProperties.body.url) === 'string'
    && requestProperties.body.url.trim().length > 0
        ? requestProperties.body.url
        : false;

    const method = typeof (requestProperties.body.method) === 'string'
    && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
        ? requestProperties.body.method
        : false;

    const successCodes = typeof (requestProperties.body.successCodes) === 'object'
    && requestProperties.body.successCodes instanceof Array
        ? requestProperties.body.successCodes
        : false;

    const timeoutSeconds = typeof (requestProperties.body.timeoutSeconds) === 'number'
    && requestProperties.body.timeoutSeconds % 1 === 0
    && requestProperties.body.timeoutSeconds >= 1
    && requestProperties.body.timeoutSeconds <= 5
        ? requestProperties.body.timeoutSeconds
        : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        const token = typeof requestProperties.headerObject.token === 'string'
            ? requestProperties.headerObject.token
            : false;
        // Find the phone using token
        data.read('tokens', token, (err1, tokenData) => {
            if (!err1 && tokenData) {
                const userPhone = parseJSON(tokenData).phone;
                data.read('users', userPhone, (err2, userData) => {
                    if (!err2, userData) {
                        tokenHandler._token.verify(token, userPhone, (tokenIsValid) => {
                            if (tokenIsValid) {
                                const userObject = parseJSON(userData);
                                const userChecks = typeof (userObject.checks) === 'object'
                                    && userObject.checks instanceof Array
                                    ? userObject.checks
                                    : [];
                                if (userChecks.length < maxChecks) {
                                    const checkId = createRandomString(20);
                                    const checkObject = {
                                        id: checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds,
                                    };
                                // save the data
                                data.create('checks', checkId, checkObject, (err3) => {
                                    if (!err3) {
                                        // add check id to the user's object
                                        userObject.checks = userChecks;
                                        userObject.checks.push(checkId);

                                        // Save new user data
                                        data.update('users', userPhone, userObject, (err4) => {
                                            if (!err4) {
                                                callback(200, checkObject);
                                            } else {
                                                callback(500, {
                                                    error: 'There is a problem in serve side!',
                                                });
                                            }
                                        });
                                    } else {
                                        callback(500, {
                                            error: 'Data not created, server error!',
                                        });
                                    }
                                });
                                } else {
                                    callback(401, {
                                        error: 'Max check limit reached!',
                                    });
                                }
                            } else {
                                callback(403, {
                                    error: 'Authentication failed!',
                                });
                            }
                        });
                    } else {
                        callback(400, {
                            error: 'User not found!',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Athentication failed!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Woops! Something wrong on your request!',
        });
    }
};

handler._check.get = (requestProperties, callback) => {
    const id = typeof requestProperties.queryStringObject.id === 'string'
        && requestProperties.queryStringObject.id.trim().length >= 19
            ? requestProperties.queryStringObject.id
            : false;
    if (id) {
        // find the check
        data.read('checks', id, (err, checkData) => {
            const token = typeof requestProperties.headerObject.token === 'string'
                ? requestProperties.headerObject.token
                : false;
            tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid) => {
                if (tokenIsValid) {
                    callback(200, parseJSON(checkData));
                } else {
                    callback(403, {
                        error: 'Authentication failed!',
                    });
                }
            });
        });
    } else {
        callback(400, {
            error: 'Woops! Something wrong on your request!',
        });
    }
};

handler._check.put = (requestProperties, callback) => {
    const id = typeof requestProperties.body.id === 'string'
        && requestProperties.body.id.trim().length >= 19
            ? requestProperties.body.id
            : false;
    const protocol = typeof (requestProperties.body.protocol) === 'string'
    && ['http', 'https'].indexOf(requestProperties.body.protocol) > -1
        ? requestProperties.body.protocol
        : false;
    const url = typeof (requestProperties.body.url) === 'string'
    && requestProperties.body.url.trim().length > 0
        ? requestProperties.body.url
        : false;

    const method = typeof (requestProperties.body.method) === 'string'
    && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(requestProperties.body.method) > -1
        ? requestProperties.body.method
        : false;

    const successCodes = typeof (requestProperties.body.successCodes) === 'object'
    && requestProperties.body.successCodes instanceof Array
        ? requestProperties.body.successCodes
        : false;

    const timeoutSeconds = typeof (requestProperties.body.timeoutSeconds) === 'number'
    && requestProperties.body.timeoutSeconds % 1 === 0
    && requestProperties.body.timeoutSeconds >= 1
    && requestProperties.body.timeoutSeconds <= 5
        ? requestProperties.body.timeoutSeconds
        : false;

    console.log(id);
    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            data.read('checks', id, (err1, checkData) => {
                if (!err1 && checkData) {
                    const checkObject = parseJSON(checkData);
                    const token = typeof requestProperties.headerObject.token === 'string'
                    ? requestProperties.headerObject.token
                    : false;
                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            if (protocol) {
                                checkObject.protocol = protocol;
                            }
                            if (url) {
                                checkObject.url = url;
                            }
                            if (method) {
                                checkObject.method = method;
                            }
                            if (successCodes) {
                                checkObject.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkObject.timeoutSeconds = timeoutSeconds;
                            }
                            // store the updated data
                            data.update('checks', id, checkObject, (err2) => {
                                if (!err2) {
                                    callback(200, checkObject);
                                } else {
                                    callback(500, {
                                        error: 'Failed to update!',
                                    });
                                }
                            });
                        } else {
                            callback(500, {
                                error: 'Athentication failed!',
                            });
                        }
                    });
                } else {
                    callback(500, {
                        error: 'Updating failed!',
                    });
                }
            });
        } else {
            callback(400, {
                error: 'You must provide at least one field to update!',
            });
        }
    } else {
        callback(400, {
            error: 'Woops! Something is wrong on your serve side!',
        });
    }
};

handler._check.delete = (requestProperties, callback) => {
    const id = typeof requestProperties.queryStringObject.id === 'string'
        && requestProperties.queryStringObject.id.trim().length >= 19
            ? requestProperties.queryStringObject.id
            : false;
    if (id) {
        // find the check
        data.read('checks', id, (err, checkData) => {
            const token = typeof requestProperties.headerObject.token === 'string'
                ? requestProperties.headerObject.token
                : false;
            tokenHandler._token.verify(token, parseJSON(checkData).userPhone, (tokenIsValid) => {
                if (tokenIsValid) {
                    // delete check data
                    data.delete('checks', id, (err1) => {
                        if (!err1) {
                            // delete from user data
                            data.read('users', parseJSON(checkData).userPhone, (err2, userData) => {
                                const userObject = parseJSON(userData);
                                if (!err2 && userData) {
                                    const userChecks = typeof (userObject.checks) === 'object'
                                        && userObject.checks instanceof Array ? userObject.checks : [];

                                    // remove the deleted check id from users list of checks
                                    const checkPosition = userChecks.indexOf(id);
                                    if (checkPosition > -1) {
                                        userChecks.splice(checkPosition, 1);
                                        // save user data again
                                        userObject.checks = userChecks;
                                        data.update('users', userObject.phone, userObject, (err3) => {
                                            if (!err3) {
                                                callback(200, {
                                                    message: 'Check Data updated successfully!',
                                                });
                                            } else {
                                                callback(500, {
                                                    error: 'Wopps! Checks not updated!',
                                                });
                                            }
                                        });
                                    } else {
                                        callback(500, {
                                            error: 'The check id you looking for, is not found in this user!',
                                        });
                                    }
                                } else {
                                    callback(500, {
                                        error: 'Data not found!',
                                    });
                                }
                            });
                        } else {
                            callback(500, {
                                error: 'Data not deleted!',
                            });
                        }
                    });
                } else {
                    callback(403, {
                        error: 'Authentication failed!',
                    });
                }
            });
        });
    } else {
        callback(400, {
            error: 'Woops! Something wrong on your request!',
        });
    }
};

module.exports = handler;
