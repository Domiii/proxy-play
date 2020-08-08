
export default async function javascriptTransform(meta, data) {
  data = data.toString('utf8');
  data = `console.log('Injected: ${meta.url}');\n\n` + data;
  // const lines = data.split('\n');
  // if (lines?.[0].startsWith('use strict')) {
    
  // }
  return data;
}