// Title:: Server library //
// To kill server run :: npx kill-port 3000
// Dependencies
const http = require('http');
const { handleReqRes } = require('../helpers/handleReqRes');

// server object - module scaffolding
const server = {};

// configuration
server.config = {
    port: 3000,
};
// Create server
server.createServer = () => {
    const createServerVar = http.createServer(server.handleReqRes);
    createServerVar.listen(server.config.port, () => {
        console.log(`Listening to port ${server.config.port}`);
    });
};

// handle Request Response
server.handleReqRes = handleReqRes;

// Start server
server.init = () => {
    server.createServer();
};

module.exports = server;
