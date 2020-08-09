import proxy from 'express-http-proxy';
import pull from 'lodash/pull';
import colors from 'colors/safe';
import { transformContent } from './transforms';
import { getHeader, getContentType } from './util/httpUtil';

let rootUrlObj;

const BR = 'br';

/**
 * Has several customization options.
 * WARNING: this is not thread-safe! Will fail if requesting different urls in parallel.
 * 
 * @see https://github.com/villadora/express-http-proxy/tree/master/index.js
 */
export function proxyRoot(req, res, next) {
  return _proxy(req, res, next, { root: true, relativePath: '/root' });
}

export function proxyChild(req, res, next) {
  return _proxy(req, res, next, { root: false, relativePath: '/child' });
}

function makePath(targetUrl, origin) {
  let targetPath;

  if (origin) {
    // full url
    targetPath = targetUrl.replace(origin.toLowerCase(), '');
  }
  else {
    // path only
    targetPath = targetUrl;
  }

  if (!targetPath.startsWith('/')) {
    targetPath = '/' + targetPath;
  }
  return targetPath;
}

function _proxy(req, res, next, cfg) {
  const { root: isRoot, relativePath } = cfg;

  // TODO: handle sub-sequent requests using memoized host?
  // TODO: handle redirects

  let targetUrl = req.originalUrl.substring(relativePath.length + 1);
  let urlObj;
  try {
    if (targetUrl.startsWith('//')) {
      // for some reason, URL module is not smart enough for this?
      targetUrl = (rootUrlObj?.protocol || 'https:') + '' + targetUrl;
    }
    // if (targetUrl.startsWith('www.')) {
    //   // assume https by default
    //   targetUrl = (rootUrlObj?.protocol || 'https:') + '//' + targetUrl;
    // }
    urlObj = new URL(targetUrl);

    if (isRoot) {
      // child URLs should not set this
      console.debug(`Proxy: ${targetUrl}`);
      rootUrlObj = urlObj;
    }
  }
  catch (err) {
    urlObj = rootUrlObj;
    // console.debug(`  (requested child) ${targetUrl} (${colors.red(err.message)})`);
  }

  let { origin, protocol, host } = urlObj;
  const targetPath = makePath(targetUrl, origin);
  const relativeTargetUrl = targetUrl.replace(rootUrlObj?.origin?.toLowerCase() || '', '') || '/';

  // weird: protocol would end up being 'https:', instead of 'https'
  protocol = protocol.replace(/[^\w]+/g, '');
  const useHttps = protocol === 'https';

  const p = proxy(host, {
    https: useHttps,

    /**
     * @see https://www.npmjs.com/package/express-http-proxy#proxyreqoptdecorator--supports-promise-form
     * @see https://github.com/villadora/express-http-proxy/blob/master/app/steps/decorateProxyReqOpts.js
     */
    proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
      const acceptedEncodings = getHeader(proxyReqOpts.headers, 'accept-encoding')?.split(/, ?/);
      if (acceptedEncodings && acceptedEncodings.includes(BR)) {
        pull(acceptedEncodings, BR);
        proxyReqOpts.headers['accept-encoding'] = acceptedEncodings.join(', ');
      }

      proxyReqOpts.rejectUnauthorized = false;
      return proxyReqOpts;
    },

    proxyReqPathResolver(userReq) {
      // write msg
      const msg = `  req  ${relativeTargetUrl}`;
      console.debug(msg);
      // process.stdout.write(colors.gray(msg));

      return targetPath;
    },

    /**
     * NOTE: this is called before `userResDecorator`, 
     * so we can use it to get access to the `proxyReq`, which we need to get the target url.
     * @see https://www.npmjs.com/package/express-http-proxy#userresheaderdecorator
     * @see https://github.com/villadora/express-http-proxy/blob/master/app/steps/decorateUserResHeaders.js
     */
    userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
      // for some reason, this data is hidden from us later on, so we keep track of it here

      const encoding = getHeader(headers, 'content-encoding');
      // console.warn(' encoding', encoding);
      if (encoding === BR) {
        headers['content-encoding'] = 'identity';
        // delete headers['content-encoding'];
        delete headers['content-length'];
        // throw new Error('Invalid encoding: ' + encoding);
      }

      // getHeader(reqHeaders, 'host')
      proxyRes.__meta = {
        url: proxyReq.path || '/',
        proxyReq,
        reqHeaders: headers,
        encoding,
        origin,
        targetPath,
        localOrigin: global.localOrigin
      };
      return headers;
    },

    /**
     * NOTE: For `userResDecorator`, all responses are buffered and function is called on stream `end` event.
     * @see https://www.npmjs.com/package/express-http-proxy#userresdecorator-was-intercept-supports-promise
     * @see https://github.com/villadora/express-http-proxy/blob/master/app/steps/decorateUserRes.js
     */
    async userResDecorator(proxyRes, proxyResData, userReq, userRes) {
      // log message
      const status = proxyRes.statusCode;
      let col;
      if (status >= 400) {
        col = colors.red;
      } 
      else if (status >= 300) {
        col = colors.yellow;
      }
      else {
        col = colors.green;
      }

      // handle data
      const meta = proxyRes.__meta;
      const contentType = getContentType(proxyRes.headers) || '';
      const { encoding } = meta;

      if (encoding === BR) {
        // TODO: brotli is not supported -- https://github.com/villadora/express-http-proxy/issues/360
        throw new Error('Encoding not supported: br');
      }

      try {
        // console.warn(stringData);
        const content = await transformContent(contentType, meta, proxyResData);
        // we are done!
        // process.stdout.write('\n');
        console.debug(`    send ${targetPath} (${col(status.toString())})`);
        // if (status >= 300) {
        //   console.debug(`    > ${JSON.stringify(meta.proxyReq._headers, null, 5)}`);
        //   console.debug(`    < ${JSON.stringify(proxyRes.headers, null, 5)}`);
        // }
        return content;
      }
      catch (err) {
        throw new Error(`Could not transform file content - ${err.stack || err}`);
      }
    },

    // proxyErrorHandler(err, res, next) {
    //   // $ code node_modules/express-http-proxy/app/steps/sendProxyRequest.js 
    //   // something went wrong :(
    //   // process.stdout.write(colors.red('ERROR') + '\n');
    //   next(err);
    // }
  });

  return p(req, res, next);
}