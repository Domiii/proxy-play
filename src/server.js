import {
  proxyRoot,
  proxyChild
 } from './proxy';
import Express from 'express';

const app = Express();

app.use('/root/*', proxyRoot);
app.use('/child/*', proxyChild);

// app.use(
//   function errorHandler(err, req, res, next) {
//     if (!res.headersSent) {
//       // return next(err)
//       res.status(500)
//     }
//     console.error(err);
//     res.send(`<pre>${err.toString()}</pre>`).end();
//   }
// );

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