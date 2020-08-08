import javascriptTransform from './javascriptTransform';
import htmlTransform from './htmlTransform';

/**
 * Use this, if no content type matches.
 */
function defaultTransform(req, data) {
  return data;
}

const transformTypes = new Map(Object.entries({
  // 'text/javascript': javascriptTransform,
  // 'application/javascript': javascriptTransform,
  'text/html': htmlTransform
}));


export async function transformContent(contentType, meta, data) {
  contentType = contentType.toLowerCase();
  let transform;
  if (contentType.includes('javascript')) {
    // e.g.: text/javascript, application/javascript, application/x-javascript and more!
    transform = javascriptTransform;
  }
  else {
    transform = transformTypes.get(contentType) || defaultTransform;
  }
  return transform(meta, data);
}