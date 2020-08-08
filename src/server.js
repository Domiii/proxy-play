import proxy from './proxy';
import Express from 'express';

const app = Express();

app.use(proxy);

export default app;



// const server = restify.createServer({
//   name: 'localhost'
// });

// server.use(restify.plugins.queryParser({ mapParams: false }));

// // add proxy
// server.opts('/', proxy.opts);
// server.get('/*', proxy.get);
// server.post('/*', proxy.post);


// module.exports = server;