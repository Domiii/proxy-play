import proxy from 'express-http-proxy';
import { transformContent } from './transforms';
import { getHeader, getContentType } from './util/httpUtil';

/**
 * Has several customization options.
 * 
 * @see https://github.com/villadora/express-http-proxy/blob/ad94d320390735157133e405969161d82c6ab58d/index.js
 */
export default function (req, res, next) {
  
  // TODO: handle sub-sequent requests using memoized host?
  // TODO: handle redirects

  const targetUrl = req.path.toLowerCase().substring(1);
  const urlObj = new URL(targetUrl);
  let {
    origin,
    protocol,
    host
  } = urlObj;

  // weird: protocol would end up being 'https:', instead of 'https'
  protocol = protocol.replace(/[^\w]+/g, '');

  console.debug(`Requesting ${targetUrl}`);
  console.warn(protocol);

  const p = proxy(host, {
    https: protocol === 'https',
    proxyReqPathResolver(userReq) {
      let path = targetUrl.replace(origin.toLowerCase(), '');
      if (!path.startsWith('/')) {
        path = '/' + path;
      }
      return path;
    },

    /**
     * NOTE: this is called before `userResDecorator`, 
     * so we can use it to get access to the `proxyReq`, which we need to get the target url.
     * @see https://www.npmjs.com/package/express-http-proxy#userresheaderdecorator
     * @see https://github.com/villadora/express-http-proxy/blob/master/app/steps/decorateUserResHeaders.js
     */
    userResHeaderDecorator(reqHeaders, userReq, userRes, proxyReq, proxyRes) {
      // for some reason, this data is hidden from us later on, so we keep track of it here

      // getHeader(reqHeaders, 'host')
      proxyRes.__meta = {
        url: proxyReq.originalUrl,
        proxyReq,
        reqHeaders
      };
      return reqHeaders;
    },

    /**
     * NOTE: For `userResDecorator`, all responses are buffered and function is called on stream `end` event.
     * @see https://www.npmjs.com/package/express-http-proxy#userresdecorator-was-intercept-supports-promise
     * @see https://github.com/villadora/express-http-proxy/blob/master/app/steps/decorateUserRes.js
     */
    async userResDecorator(proxyRes, proxyResData, userReq, userRes) {
      const meta = proxyRes.__meta;
      const {
        url,
        proxyReq,
        reqHeaders
      } = meta;

      const contentType = getContentType(proxyRes.headers) || '';

      try {
        const stringData = proxyResData.toString('utf8');
        return transformContent(contentType, meta, stringData);
      }
      catch (err) {
        console.error(' Could not transform file content -', err);
      }
    }
  });

  return p(req, res, next);
}