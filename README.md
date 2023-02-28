# Seamless

Use the [boilerplate](https://github.com/maekoos/seamless-boilerplate) to get
started with seamless and react.

## What is seamless?
A server-client interface simplifying API-creation and usage.

```js
// server.js:
module.exports = {
      hello: async ({ args, }) => "Hi " + args.name,
};

// client.js:
import { functions, } from 'api.generated.js';
const hello = await functions.hello({ name: 'Ben', });
console.log(hello) //-> Hi Ben
```

## Documentation
TODO

## To Do:

- [x] [Getting started](https://github.com/maekoos/seamless-boilerplate)-guide
- [x] Expose API to use seamless from a node script (see production.md)
- [ ] Documentation
- [ ] Switch to typescript
- [ ] Generated code requires `jwt-decode`. Automatically make sure it is
      installed?
