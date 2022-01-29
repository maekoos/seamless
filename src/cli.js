#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exit } = require('process');

const CONFIG_PATH = path.join(process.cwd(), 'seamless.js');
if (!fs.existsSync(CONFIG_PATH)) {
    console.log("No seamless.js file found in root of project directory.");
    exit();
}
const config = require(CONFIG_PATH);

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) console.log("Running in production mode.");
else console.log("Running in development mode.")

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 1337;

if (!isProduction) {
    const generate = require('./generate');
    generate(config, { HOST, PORT, });
}

const Server = require('./Server');
const s = new Server(config, isProduction);

s.listen(HOST, PORT, () => {
    console.log(`OK - Running: http://${HOST}:${PORT}/`);
});
