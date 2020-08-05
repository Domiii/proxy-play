require('./util/prettyLog');

const server = require('./server');

const port = process.env.PORT || 8080;

function main() {
  server.listen(port, 'localhost', function () {
    console.log('%s listening at %s', server.name, server.url); //eslint-disable-line
  });
}

main();