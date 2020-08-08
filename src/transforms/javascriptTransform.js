
export default async function javascriptTransform(req, data) {
  data = `console.log('Running injected js file ${req.url}')\n` + data;
  // const lines = data.split('\n');
  // if (lines?.[0].startsWith('use strict')) {
    
  // }
  return data;
}