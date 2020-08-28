Acts as a proxy to inject [Dbux](https://github.com/Domiii/dbux) into all scripts of any website, before they execute in the browser, thereby allowing to analyze any website's scripts with Dbux.

# Usage

1. Install the [dbux-code](https://github.com/Domiii/dbux/dbux-code) VSCode extension.
1. Open VSCode and [`start the Dbux Runtime Server`](https://github.com/Domiii/dbux/dbux-code#dbux-runtimeserver).
1. `yarn install`
1. `yarn start`
1. Go to: http://localhost:8080/https://stackoverflow.com
1. Analyze your files!

# How does it work?

Instrumentation primarily happens in [src/transforms/javascriptTransform.js](src/transforms/javascriptTransform.js) and [src/transforms/instrument.js](src/transforms/instrument.js).

# TODO

* gather urls that are not instrumented (being sent straight to the domain, not under any child route)
* store files, so we can actually "go to code", "select traces" etc.
* caching (because instrumentation is *slow* on large files)
* whitelisting of "too large files"
* work around CSP
