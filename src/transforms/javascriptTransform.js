import instrument from './instrument';

// TODO: add caching

const maxSize = 300 * 1000;
const maxSymbols = 10000;

function countSymbols(code) {
  return code.split(/[^\w]/).length;
}

export default async function javascriptTransform(meta, buf) {
  let code = buf.toString('utf8');

  // rough measure count of symbol count
  let symbolCount;
  const ok = buf.length <= maxSize && (symbolCount = countSymbols(code)) <= maxSymbols;

  // size in kb
  const kb = buf.length / 1000;

  // log message
  const { targetPath } = meta;
  console.debug(`    ${ok ? 'INST' : 'skip'} ${targetPath} (${kb} kb${symbolCount ? `, ${symbolCount} symbols` : ''})`);

  // instrumentation
  if (ok) {
    code = instrument(code);
    // console.debug('  done.');
  }

  code = `console.debug('[DBUX] Instrumented: ${meta.url}');\n\n` + code;
  // const lines = data.split('\n');
  // if (lines?.[0].startsWith('use strict')) {

  // }
  return code;
}