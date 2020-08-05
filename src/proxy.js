/**
 * 
 */

const request = require('request');

let requireHeader = [
  'origin',
  'x-requested-with',
];

let clientHeadersBlacklist = new Set([
  'host',
  'cookie',
]);
let serverHeadersBlacklist = new Set([
  'set-cookie',
  'connection',
]);

/*
get handler handles standard GET reqs as well as streams
*/
const proxy = method => (req, res, next) => {
  try {
    res.header('Access-Control-Allow-Origin', '*'); // Actually do the CORS thing! :)

    let url;

    switch (method) {
      case 'GET':
        url = req.url.substr(1);
        break;
      case 'POST':
        url = req.params[0];
        break;
    }

    let urlObj;
    let cookieOrigin;
    try {
      urlObj = new URL(url);
    }
    catch (err) {
      // invalid url -> parse cookies and fix things up
      // NOTE: restify, for some reason has no built-in cookie plugin
      if (req.headers['cookie']) {
        const cookies = Object.fromEntries(req.headers['cookie'].split(';').map(cook => cook.trim().split('=')));
        cookieOrigin = cookies['x-custom-proxy-origin'];
        if (cookieOrigin && (!url || !url.startsWith(cookieOrigin))) {
          if (!cookieOrigin.endsWith('/') && !url.startsWith('/')) {
            url = '/' + url;
          }
          url = cookieOrigin + url;
        }
      }
    }

    if (!url) {
      res.status(404);
      return res.end('No URL given');
    }

    urlObj = new URL(url);

    // try {
    // }

    // if (req.headers.referer) {
    //   req.headers.referer = urlObj.origin;
    //   if (!url.startsWith()) {

    //   }
    //   // http://localhost:8080/
    // }

    // // require Origin header
    // if (!requireHeader.some(header => req.headers[header])) {
    //   res.statusCode = 403;
    //   return res.end('Origin: header is required');
    // }

    // forward client headers to server
    var headers = {};
    for (var header in req.headers) {
      if (!clientHeadersBlacklist.has(header.toLowerCase())) {
        headers[header] = req.headers[header];
      }
    }
    var forwardedFor = req.headers['X-Fowarded-For'];
    headers['X-Fowarded-For'] = (forwardedFor ? forwardedFor + ',' : '') + req.connection.remoteAddress;
    // console.debug(`  ${JSON.stringify(req.headers, null, 4)}`);


    // TODO: replace request with node-fetch
    //      see: https://stackoverflow.com/questions/55349722/writing-the-stream-returned-by-node-fetch
    request(url, {
      method,
      headers,
      strictSSL: false
    }) // request the document that the user specified
      .on('response', function (req2) {
        res.statusCode = req2.statusCode;
        console.debug(`Request for "${url}" at "${req.connection.remoteAddress}": ${res.statusCode}`);

        // if the page already supports cors, redirect to the URL directly
        if (req2.headers['access-control-allow-origin'] === '*') {
          console.debug('  Redirect:', url);
          res.redirect(url, next);
        }

        // add some custom cookies
        // see https://stackoverflow.com/questions/18795220/set-cookie-header-not-working
        res.header('access-control-expose-headers', 'Set-Cookie');

        if (!cookieOrigin) {
          res.header("Set-Cookie", `x-custom-proxy-origin=${urlObj.origin}; Path=/;`);
        }

        // add all other headers
        for (var header in req2.headers) {
          if (!serverHeadersBlacklist.has(header)) {
            res.header(header, req2.headers[header]);
          }
        }
        // must flush here -- otherwise pipe() will include the headers anyway!
        res.flushHeaders();
      })
      // .on('data', function (chunk) {
      //   data += chunk.length;
      // })
      .on('end', function () {
        res.end(); // End the response when the stream ends
      })
      .on('error', handleError)
      .pipe(res); // Stream requested url to response
    // next();
  }
  catch (err) {
    return handleError(err);
  }

  function handleError(err) {
    console.error(err);
    res.status(500);
    res.end(err.message);
  }
};

/*
opts handler allows us to use our own CORS preflight settings
*/
function opts(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET'); // Only allow GET for now
  res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers'));
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hrs if supported
  res.send(200);
  next();
}

const get = proxy('GET');
const post = proxy('POST');

module.exports = { get, post, opts };