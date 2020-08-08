/**
 * NOTE: headers are case insensitive.
 * 
 * @see https://stackoverflow.com/questions/5258977/are-http-headers-case-sensitive
 */
export function getHeader(headers, headerName) {
  headerName = headerName.toLowerCase();
  const key = Object.keys(headers).find(h => h.toLowerCase() === headerName);
  return key && headers[key] || null;
}

export function getContentType(headers) {
  const contentTypeHeader = getHeader(headers, 'content-type');
  return contentTypeHeader?.split(';')[0]?.trim() || '';
}