// config.js

// Server configuration
const SERVER_IP = 'http://127.0.0.1';
const SERVER_PORT = 5001;
const SERVER_PREFIX = '/archive/v1';

const SERVER_URL = `${SERVER_IP}:${SERVER_PORT}${SERVER_PREFIX}`;

module.exports = {
    SERVER_IP,
    SERVER_PORT,
    SERVER_PREFIX,
    SERVER_URL
};