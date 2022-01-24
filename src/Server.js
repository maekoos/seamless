const express = require('express');
const ws = require('ws');
const errorCodes = require('./errorCodes');
const jwt = require('jsonwebtoken');

module.exports = class Server {
    constructor(config, isProd = false) {
        this.isProd = isProd;

        this._handleConnection = this._handleConnection.bind(this);
        this._handleMessage = this._handleMessage.bind(this);

        this._config = config;
        this.app = express();
        this._registerMiddlewares();
        this._registerPublicPaths();

        if (!this._config.jwtPrivateKey) {
            console.warn("No JWT private key detected. This could be very unsafe.");
            if (this.isProd) throw new Error('A private jwt-key is required in production.');
        }
        this._jwtKey = this._config.jwtPrivateKey || 'generate a key here?';

        if (!this._config.functions || typeof this._config.functions !== 'object') throw new Error("Functions has to be an object");

        const wsServer = this._wsServer = new ws.Server({ noServer: true });
        wsServer.on('connection', this._handleConnection);

        if (this._config.expressConfig) {
            if (typeof this._config.expressConfig !== 'function') throw new Error('expressConfig should be a function ((app, express) => { ... })');
            this._config.expressConfig(this.app, express);
        }
    }

    _registerMiddlewares() {
        if (this.isProd) {
            const compression = require('compression');
            this.app.use(compression);
        }
    }

    _registerPublicPaths() {
        if (!this._config.publicPaths) return;
        if (!Array.isArray(this._config.publicPaths)) throw new Error(`'publicPaths': expected 2D-array.`);

        this._config.publicPaths.forEach(pp => {
            if (!Array.isArray(pp) || pp.length !== 2) throw new Error('Each publicPath should be an array of [urlPath, folderPath].');

            const [urlPath, filePath] = pp;
            this.app.use(urlPath, express.static(filePath));
        })
    }

    listen(hostname, port, cb) {
        const server = this.app.listen(port, hostname, cb);

        server.on('upgrade', (request, socket, head) => {
            this._wsServer.handleUpgrade(request, socket, head, socket => {
                //? What does this do and is it necessary?
                // this._wsServer.emit('connection', socket, request);
            });
        });
    }

    _handleConnection(socket) {
        socket.on('message', async message => {
            await this._handleMessage(socket, message);
        });
    }

    async _handleMessage(socket, message) {
        function findKey(obj, keys) {
            if (keys.length === 0) return [true, obj];
            const key = keys[0];

            if (Object.keys(obj).indexOf(key) === -1) return [false];
            return findKey(obj[key], keys.slice(1));
        }

        let data;
        try {
            data = JSON.parse(message.toString());

            if (!data.reqId || typeof data.reqId !== 'string') return;
        } catch (e) {
            console.log(message);
            console.log("Error parsing request");
            return;
        }
        const reqId = data.reqId;
        //TODO Return "invalid request"?
        if (!data.function || typeof data.function !== 'string') return;

        try {
            const reqAddr = data.function.split('/');
            const [fnExists, fn] = findKey(this._config.functions, reqAddr);

            if (!fnExists) {
                socket.send(JSON.stringify({ reqId, success: false, code: errorCodes.FUNCTION_NOT_FOUND, }));
                return;
            }

            let session = {};
            if (data.token) {
                try {
                    if (typeof data.token !== 'string') {
                        throw new Error("Bad token: Respond with error code?");
                    }

                    const a = jwt.verify(data.token, this._jwtKey);
                    if (a) session = a;
                } catch (e) {
                    // TODO: Are there errors that need handling?
                    session = {};
                }
            }

            const req = { reqId, session, args: data.args, };

            let results;
            if (typeof fn !== 'function') throw new Error("Not a function: " + fn.toString());

            try {
                results = await fn(req);
            } catch (error) {
                if (!this.isProd) {
                    console.log(error);
                    console.log("[error]", message.toString());
                } else {
                    // TODO Better logging in production
                    console.log(error);
                    console.log("[error]", message.toString());

                    // TODO Some error are allowed...
                    error = new Error('Error 500: Unknown server error');
                };

                socket.send(JSON.stringify({ reqId, success: false, error: error.toString(), }));
                return;
            }

            const token = jwt.sign({ ...req.session }, this._jwtKey);
            socket.send(JSON.stringify({ reqId, success: true, results, token, }));
        } catch (e) {
            console.log(e);
            console.log("[error]", message.toString());

            socket.close();
        }
    }
}





