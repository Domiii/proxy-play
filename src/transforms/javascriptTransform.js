import instrument from './instrument';

// TODO: add caching

const maxSize = 300 * 1000;
const maxSymbols = 10000;

function countSymbols(code) {
  return code.split(/[^\w]/).length;
}

export default async function javascriptTransform(meta, buf) {
  let code = buf.toString('utf8');

  let symbolCount;
  const ok = buf.length <= maxSize && (symbolCount = countSymbols(code)) <= maxSymbols;

  const kb = buf.length / 1000;

  console.debug(`  ${ok ? 'instrumenting' : 'skipped'} (${kb} kb${symbolCount ? `, ${symbolCount} symbols` : ''})`);
  if (ok) {
    code = instrument(code);
    // console.debug('  done.');
  }

  code = `console.log('Injected: ${meta.url}');\n\n` + code;
  // const lines = data.split('\n');
  // if (lines?.[0].startsWith('use strict')) {

  // }
  return code;
}