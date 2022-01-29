// Returns an express server.
// 
// s.listen(host, port, () => {
//     console.log(`OK - Running: http://${host}:${port}/`);
// });
module.exports.production = (config) => {
    const Server = require('./Server');
    const s = new Server(config, true);

    return s;
}