import cheerio from 'cheerio';
import urlJoin from 'url-join';
import javascriptTransform from './javascriptTransform';

/**
 * This is necessary for many websites to instrument scripts that are added dynamically.
 * E.g. StackOverflow injects its main script dynamically.
 * 
 * TODO: fix src for dynamically injected script tags
 * NOTE: cannot be done - see: https://stackoverflow.com/questions/2100784/is-it-possible-to-stop-a-dynamically-inserted-script-tag
 */
function observerInitCode() {
  //   return /*html*/`
  // <script>
  //     // Select the node that will be observed for mutations
  //   const targetNode = document;

  //   // Options for the observer (which mutations to observe)
  //   const config = { childList: true, subtree: true };

  //   // Callback function to execute when mutations are observed
  //   // see https://codepen.io/impressivewebs/pen/GeRWPX?editors=0011
  //   const callback = function(mutationsList, observer) {
  //     for(const mutation of mutationsList) {
  //       // if (mutation.type === 'childList') { }
  //       const {addedNodes} = mutation;
  //       for (const added of addedNodes) {
  //         if (added.tagName.toLowerCase() === 'script') {
  //           // added a script!
  //           added.remove();
  //         }
  //       }
  //     }
  //   };

  //   // create an observer instance linked to the callback function
  //   const observer = new MutationObserver(callback);

  //   // start observing the target node for configured mutations
  //   observer.observe(targetNode, config);
  // </script>
  //   `;
  return ``;
}

function fixXHRInitCode(meta) {
  const { localOrigin } = meta;

  // TODO: need to fix XHR urls, or we will be slapped around with CORS
  const fixUrlCode = /*javascript*/`
`;

  // see: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/open

  // see: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

  return `
function xhrUrl(url) {
  console.debug('[DBUX] XHR hook', url);
  return "${localOrigin}/child/" + url;
}

const s = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function _proxiedOpen(method, url, ...moreArgs) {
  s.call(this, method, xhrUrl(url), ...moreArgs);
};

const f = window.fetch;
window.fetch = (url, ...moreArgs) => f(xhrUrl(url), ...moreArgs);
  `;
}

function fixEvalInitCode() {
  // TODO: override eval
  return ``;
}

function initCode(meta) {
  const code = [
    fixXHRInitCode,
    observerInitCode,
    fixEvalInitCode
  ].map(s => `(function() {${(s && s(meta) || '').trim()}})();` + '\n\n').join('');
  return `
  <script src="/dbux-runtime/index.js"></script>
  <script>if (!window.__custom_proxy_stuff_initialized_az8gf6zz) {
    window.__custom_proxy_stuff_initialized_az8gf6zz = true;
    ${code}
  }</script>`;
}

function fixUrl(localOrigin, src) {
  return urlJoin(localOrigin, 'child') + '/' + src;
}

/**
 * Fix src attributes.
 */
function fixSrcs(meta, $els) {
  const {
    localOrigin
  } = meta;

  for (const $el of $els) {
    let src = $el.attr('src');
    if (src && !src.startsWith(localOrigin)) {
      src = fixUrl(localOrigin, src);
      $el.attr('src', src);
    }
    let href = $el.attr('href');
    if (href && !href.startsWith(localOrigin)) {
      href = fixUrl(localOrigin, href);
      $el.attr('href', href);
    }
  }
}

/**
 * modify content of all inline JS <script> tags
 */
async function fixInlineJs(meta, $scriptTags) {
  for (const $el of $scriptTags) {
    const type = $el.attr('type');
    if (type && type.toLowerCase() !== 'text/javascript') {
      // JS only
      continue;
    }

    // NOTE: Cheerio is weird, and different from jquery here:
    //        We can only access JS text content via `html()`; `text()` will return ''.
    let js = $el.html();
    if (!js.trim()) {
      // ignore empty
      continue;
    }

    js = await javascriptTransform(meta, js);

    // NOTE: Funnily enough, using `text` to set the content does work!
    $el.text(js);
  }
}

export default async function htmlTransform(meta, data) {
  data = data.toString('utf8');

  const $ = cheerio.load(data, { xmlMode: false });
  const $scriptTags = Array.from($('script')).map(el => $(el));
  const $all = Array.from($('*')).map(el => $(el));

  // fix src's to also go through the proxy
  fixSrcs(meta, $scriptTags);
  fixSrcs(meta, $all);

  // inject inline JS script tags
  await fixInlineJs(meta, $scriptTags);

  // data = '<h1>hi ####</h1>' + data;

  let html = $.html();

  // inject observers at the very top (  cannot do this in a meaningful way as of now :*(  )
  // html = injectedObservers() + html;
  html = initCode(meta) + html;

  return html;
}