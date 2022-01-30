### To run seamless in production:

Add  `"start:production": "NODE_ENV=production seamless ."` to package.json.

Then use whatever server-setup you would normally use with node (e.g forever) to run start:production. If you get an error about jwt.private, it is because you have not added one yet. Add it to your seamless.js file and try again.

**If you would rather run the server from a node script, use the API instead:**

```js
const seamless = require('seamless');

process.env.NODE_ENV = 'production';

const config = require('./seamless');
config.jwtPrivateKey = 'A SECRET KEY, MAYBE LOADED FROM ELSEWHERE';
const s = seamless.production(config);

s.listen('0.0.0.0', 6666, () => console.log("Running in production on port 6666"));
```