const fs = require('fs');
const path = require('path');

module.exports = function generate(config, { HOST, PORT }) {
    if (!config.client) return;
    if (!config.client.react) throw new Error("Only react-mode is supported for now.");

    let out = fs.readFileSync(path.join(__dirname, 'templates/template.js')) + '\n';

    out = out.replace('$HOST$', JSON.stringify(HOST.toString()));
    out = out.replace('$PORT$', PORT.toString());

    out += generateExports(config.functions).join('\n');

    try {
        const outputPath = config.client.outputPath || path.join(process.cwd(), 'api.js');
        fs.writeFileSync(outputPath, out);
    } catch (e) {
        console.warn(e);
        console.log("Error writing to client output path");
    }
}

function generateExports(exp_obj, tabLvl = 0) {
    function generateExportsInner(obj, parentReqAddr = [], tabLvl = 0) {
        const out = [];

        for (const key in obj) {
            const reqAddr = [...parentReqAddr, key];
            if (typeof obj[key] === "function") {
                out.push(`${key}: async function ({ ...args } = {}) { return await sendRequest('${reqAddr.join('/')}', args); },`)
            } else if (typeof obj[key] === "object") {
                //TODO Array
                out.push(`${key}: {`);
                out.push(...generateExportsInner(obj[key], reqAddr, 1));
                out.push('},');
            } else {
                throw new Error("Could not compile...");
            }
        }

        return out.map(x => '\t'.repeat(tabLvl) + x);
    }

    const out = [];
    out.push('export const functions = {')
    out.push(...generateExportsInner(exp_obj, [], tabLvl + 1))
    out.push('}')

    return out.map(x => '\t'.repeat(tabLvl) + x);
}
