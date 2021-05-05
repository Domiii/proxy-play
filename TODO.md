* getting a lot of 404's (on http://localhost:8080/root/https://www.google.com)
* set Access-Control-Allow-Origin
* store JS files prior to instrumentation, so we can use Dbux to trace the code
* circumvent basic security checks
   * `sript-src`, `unsafe-inline`, hash, `nonce`
      * > Refused to load the script '<URL>' because it violates the following Content Security Policy directive: "script-src github.githubassets.com". Note that 'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback.
      * > 135:3 Refused to execute inline script because it violates the following Content Security Policy directive: "script-src github.githubassets.com". Either the 'unsafe-inline' keyword, a hash ('sha256-5GY5m0YSGu573M5g8l/2gXeQbjyhvtvXbPLX2DMFsow='), or a nonce ('nonce-...') is required to enable inline execution.
   * -> test on http://localhost:8080/root/https://github.com
* > Uncaught TypeError: Cannot destructure property 'staticId' of 'staticContext' as it is undefined.
   * -> test on http://localhost:8080/root/https://stackoverflow.com
* allow rogue assets to be taken care of correctly
   * maybe store a cookie, and any request with that cookie will be proxied through the last root URL?


* fix http://localhost:8080/root/https://masteringjs.io/tutorials/express/redirect
   * several "Illegal invocation at XMLHttpRequest.open" after instrumentation
* fix http://localhost:8080/root/http://todomvc.com/examples/react/
   * always 301 :(