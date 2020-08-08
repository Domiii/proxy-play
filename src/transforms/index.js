import javascriptTransform from './javascriptTransform';
import htmlTransform from './htmlTransform';

/**
 * Use this, if no content type matches.
 */
function defaultTransform(req, data) {
  return data;
}

const transformTypes = new Map(Object.entries({
  'text/javascript': javascriptTransform,
  'text/html': htmlTransform
}));


export async function transformContent(contentType, meta, data) {
  const transform = transformTypes.get(contentType.toLowerCase()) || defaultTransform;
  return transform(meta, data);
}