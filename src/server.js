import {
  proxyRoot,
  proxyChild
 } from './proxy';
import express from 'express';

const app = express();

app.use('/root/*', proxyRoot);
app.use('/child/*', proxyChild);

// -> http://localhost:8080/dbux-runtime/index.js
app.use('/dbux-runtime', express.static('node_modules/@dbux/runtime/dist'));

app.use(function errorHandler (err, req, res, next) {

  console.error(`Unable to process request for ${req.originalUrl} -`, err);

  if (res.headersSent) {
    return next(err)
  }
  res.status(500)
  res.render('error', { error: err })
});

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