const seamless = require('seamless');

process.env.NODE_ENV = 'production';

const config = require('./seamless');
config.jwtPrivateKey = 'A SECRET KEY';
const s = seamless.production(config);

s.listen('0.0.0.0', 1337, () => console.log("Running in production on port 1337"));