module.exports = {
    hello: async () => console.log("Hello world!"),
    setSession,
    getSession,
}

async function setSession({ args, session }) {
    const { value } = args;
    session.value = value;

    return 'OK, set session';
}

async function getSession({ args, session }) {
    return session;
}