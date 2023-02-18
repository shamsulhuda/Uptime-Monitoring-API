// Token Handler

const data = require('../../lib/data');
const { hash } = require('../../helpers/utilities');
const { createRandomString } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');
const { last } = require('lodash');
const { user } = require('../../routes');

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
    const phone = typeof requestProperties.body.phone === 'string' && 
        requestProperties.body.phone.trim().length === 11 
            ? requestProperties.body.phone 
            : false;

    const password = typeof requestProperties.body.password === 'string' && 
        requestProperties.body.password.trim().length > 0 
            ? requestProperties.body.password 
            : false;
    
    if(phone && password){
        data.read('users', phone, (err1,userData)=>{
            let hasedPassword = hash(password);
            if(hasedPassword === parseJSON(userData).password){
                let tokenId = createRandomString(20);
                let expires = Date.now() + 60  * 60 * 1000;
                let tokenObject = {
                    phone,
                    'id': tokenId,
                    expires
                }
                data.create('tokens',tokenId, tokenObject,(err2)=>{
                    if(!err2){
                        callback(200, tokenObject);
                    }else{
                        callback(500,{
                            error:'Server side error!'
                        })
                    }
                })
            }else{
                callback(400,{
                    error:'Password is not valid!'
                })
            }
        })
    }else{
        callback(400,{
            error: 'Wopps! Something is wrong!'
        })
    }
};

handler._token.get = (requestProperties, callback) => {
    
};

handler._token.put = (requestProperties, callback) => {
    
}

handler._token.delete = (requestProperties, callback)=>{
    
}
module.exports = handler;
