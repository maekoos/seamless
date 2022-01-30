import { useMemo } from 'react';
import jwt from 'jwt-decode';

let ws;
const responseHandlers = {};
let token = false;
const onSetTokenHandlers = [];

export function useSession() {
    const s = useMemo(() => {
        if (!token) return false;
        return jwt(token);
    }, [token]);

    return s;
}

function setToken(newToken) {
    if (!newToken) localStorage.removeItem('t');
    else localStorage.setItem('t', newToken);
    token = newToken;

    const session = jwt(token);
    onSetTokenHandlers.map(fn => fn(session));
}

export function onSetToken(fn) {
    onSetTokenHandlers.push(fn);
    // console.log("ADD LISTENER", onSetTokenHandlers.length);
}

export function init() {
    return new Promise((resolve, reject) => {
        if (ws) ws.close();

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        if (process.env.NODE_ENV === 'development') ws = new WebSocket(`${protocol}//${$HOST$}:${$PORT$}/ws/`);
        else ws = new WebSocket(`${protocol}//${window.location.host}/ws/`);

        token = localStorage.getItem('t');

        ws.onmessage = message => {
            const data = JSON.parse(message.data);

            if (responseHandlers[data.reqId]) {
                responseHandlers[data.reqId](data);
                delete responseHandlers[data.reqId];
            } else console.log("Unhandled response:", data)
        };

        ws.addEventListener('open', function (event) {
            resolve();
        });
    });
}

export function isReady() {
    return ws && ws.readyState === 1;
}

function newId() {
    //? How terrible is it to include time here?
    return `req-${new Date().getTime()}-${Math.floor(Math.random() * 100000000).toString(36)}`
}

function sendRequestRaw(fn, args = {}) {
    return new Promise((resolve, reject) => {
        if (!isReady()) return reject("Not open");

        const reqId = newId();

        const sanitizedRequest = JSON.stringify({ function: fn, reqId, args, token, });

        responseHandlers[reqId] = ({ success, error, results, token: newToken }) => {
            if (newToken) setToken(newToken);

            if (!success) return reject(error);
            return resolve(results);
        }
        ws.send(sanitizedRequest);
    });
}

async function sendRequest(fn, args = {}) {
    // console.log(ws.OPEN);
    try {
        if (!isReady()) await init();
    } catch (e) {
        console.log(e);
        console.log("Reload the page...");
        window.location.reload();
    }
    return await sendRequestRaw(fn, args);
}
