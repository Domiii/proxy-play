import './util/prettyLog';

import server from './server';

const port = process.env.PORT || 8080;

function main() {
  server.listen(port, 'localhost', function () {
    // const origin = server.name;
    const originName = 'http://localhost';
    const origin = `${originName}:${port}`;
    console.log('\n\n\nlistening at %s', origin); //eslint-disable-line

    const exampleUrl = 'https://stackoverflow.com';
    console.log(`Example: ${origin}/${exampleUrl}`);
  });
}

main();