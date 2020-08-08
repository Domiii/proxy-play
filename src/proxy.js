import proxy from 'express-http-proxy';
import pull from 'lodash/pull';
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

function _proxy(req, res, next, cfg) {
  const { root: isRoot, relativePath } = cfg;

  // TODO: handle sub-sequent requests using memoized host?
  // TODO: handle redirects

  let targetUrl = req.baseUrl.toLowerCase().substring(relativePath.length + 1);
  let urlObj;
  try {
    if (targetUrl.startsWith('www.')) {
      // assume https by default
      targetUrl = 'https://' + targetUrl;
    }
    urlObj = new URL(targetUrl);

    if (isRoot) {
      // child URLs should not set this
      console.debug(`Request: ${targetUrl}`);
      rootUrlObj = urlObj;
    }
  }
  catch (err) {
    urlObj = rootUrlObj;
    // console.debug(`  path ${targetUrl}`);
  }

  let { origin, protocol, host } = urlObj;

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
      return proxyReqOpts;
    },

    proxyReqPathResolver(userReq) {
      let path;

      if (origin) {
        // full url
        path = targetUrl.replace(origin.toLowerCase(), '');
      }
      else {
        // path only
        path = targetUrl;
      }

      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      console.debug(` file  ${targetUrl.replace(rootUrlObj?.origin?.toLowerCase() || '', '')}`);
      return path;
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
      const meta = proxyRes.__meta;
      const contentType = getContentType(proxyRes.headers) || '';
      const { encoding } = meta;

      if (encoding === BR) {
        // TODO: brotli is not supported -- https://github.com/villadora/express-http-proxy/issues/360
        throw new Error('Encoding not supported: br');
      }

      try {
        // console.warn(stringData);
        return transformContent(contentType, meta, proxyResData);
      }
      catch (err) {
        throw new Error(`Could not transform file content - ${err.stack || err}`);
      }
    }
  });

  return p(req, res, next);
}