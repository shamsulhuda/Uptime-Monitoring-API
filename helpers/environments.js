// Environments

// Dependencies

// Module Scaffolding
const environments = {};
environments.staging = {
    port: 3000,
    envName: 'staging',
    secretKey: 'hashHsdadaffaf',
    maxChecks: 5,
    twilio: {
        fromPhone: '+12762779639',
        accountSid: 'AC3b72cafb40984326f0a21dd7d640462c',
        authToken: '3bfcf8e9f765e22bc90f032c66f513ea',
    },
};
environments.production = {
    port: 5000,
    envName: 'production',
    secretKey: 'afdasgydgJdsgt',
    maxChecks: 5,
    twilio: {
        fromPhone: '+12762779639',
        accountSid: 'AC3b72cafb40984326f0a21dd7d640462c',
        authToken: '3bfcf8e9f765e22bc90f032c66f513ea',
    },
};

// determine which environment was passed
const currentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'staging';

// export corrosponding environment object
const environmentToExport = typeof (environments[currentEnvironment]) === 'object'
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
