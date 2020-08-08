import './util/prettyLog';

import server from './server';

const port = parseInt(process.env.PORT) || 8080;

function main() {
  server.listen(port, 'localhost', function () {
    // const origin = server.name;
    const originName = 'http://localhost';
    const localOrigin = `${originName}:${port}`;
    global.localOrigin = localOrigin;
    console.log('\n\n\nlistening at %s', localOrigin); //eslint-disable-line

    // TODO: fix http://localhost:8080/child/https://static.itch.io/lib/jquery.maskMoney.js ???

    const exampleUrls = [
      'https://stackoverflow.com',
      'https://dr-d-king.itch.io/tiny-islands'
    ];
    console.debug(`Example:\n${exampleUrls.map(path => `  ${localOrigin}/root/${path}\n`).join('')}`);
  });
}

main();