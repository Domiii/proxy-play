* store JS files prior to instrumentation, so we can use Dbux to trace the code
* allow rogue assets to be taken care of correctly
   * maybe store a cookie, and any request with that cookie will be proxied through the last root URL?


* fix http://localhost:8080/root/https://masteringjs.io/tutorials/express/redirect
   * several "Illegal invocation at XMLHttpRequest.open" after instrumentation
* fix http://localhost:8080/root/http://todomvc.com/examples/react/
   * always 301 :(