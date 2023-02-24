// Token Handler

const data = require('../../lib/data');
const { hash } = require('../../helpers/utilities');
const { createRandomString } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');

// module scaffolding
const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete'];
    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._token[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._token = {};

handler._token.post = (requestProperties, callback) => {
    const phone = typeof requestProperties.body.phone === 'string'
        && requestProperties.body.phone.trim().length === 11
            ? requestProperties.body.phone
            : false;

    const password = typeof requestProperties.body.password === 'string'
        && requestProperties.body.password.trim().length > 0
            ? requestProperties.body.password
            : false;

    console.log(phone, password);

    if (phone && password) {
        data.read('users', phone, (err1, userData) => {
            const hasedPassword = hash(password);
            if (hasedPassword === parseJSON(userData).password) {
                const tokenId = createRandomString(20);
                const expires = Date.now() + 60 * 60 * 1000;
                const tokenObject = {
                    phone,
                    id: tokenId,
                    expires,
                };
                data.create('tokens', tokenId, tokenObject, (err2) => {
                    if (!err2) {
                        callback(200, tokenObject);
                    } else {
                        callback(500, {
                            error: 'Server side error!',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'Password is not valid!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'Wopps! Something is wrong!',
        });
    }
};

handler._token.get = (requestProperties, callback) => {
    const id = typeof requestProperties.queryStringObject.id === 'string'
        && requestProperties.queryStringObject.id.trim().length >= 19
            ? requestProperties.queryStringObject.id
            : false;
    if (id) {
        // Find the token
        data.read('tokens', id, (err, tokenData) => {
            const token = { ...parseJSON(tokenData) };
            if (!err && token) {
                callback(200, token);
            } else {
                callback(404, {
                    error: 'Requested token not found in server',
                });
            }
        });
    } else {
        callback(404, {
            error: 'Requested token not found:: ',
        });
    }
};

handler._token.put = (requestProperties, callback) => {
    const id = typeof requestProperties.body.id === 'string'
        && requestProperties.body.id.trim().length >= 19
            ? requestProperties.body.id
            : false;
    const extend = !!(typeof requestProperties.body.extend === 'boolean'
    && requestProperties.body.extend === true);
    if (id && extend) {
        data.read('tokens', id, (err1, tokenData) => {
            const tokenObject = parseJSON(tokenData);
            if (tokenObject.expires > Date.now()) {
                tokenObject.expires = Date.now() + 60 * 60 * 1000;
                // store the update token
                data.update('tokens', id, tokenObject, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'Token updated successfully!',
                        });
                    } else {
                        callback(500, {
                            error: 'There is a server site issue!',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'Token already expired!',
                });
            }
        });
    } else {
        callback(400, {
            error: 'There is a problem in your request!',
        });
    }
};

handler._token.delete = (requestProperties, callback) => {
    const id = typeof requestProperties.queryStringObject.id === 'string'
        && requestProperties.queryStringObject.id.trim().length >= 19
            ? requestProperties.queryStringObject.id
            : false;
    if (id) {
        // Find the token
        data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                data.delete('tokens', id, (err1) => {
                    if (!err1) {
                        callback(200, {
                            message: 'Successfully Deleted',
                        });
                    } else {
                        callback(500, {
                            error: 'Data not deleted, server error!',
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
        callback(400, {
            error: 'Something is wrong!',
        });
    }
};

handler._token.verify = (id, phone, callback) => {
    data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (parseJSON(tokenData).phone === phone && parseJSON(tokenData).expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};
module.exports = handler;
