# SandFrame (Sandbox-Iframe)

Isolate script execution from toplevel DOM.

```js
const sandFrame = new SandFrame();

sandFrame.setup((iframeContent) => {
  iframeContent.contentWindow = 'anyGlobalValue';
});

const setupPromise = new Promise((resolve, reject) => { // do something resolve();});
sandFrame.setup(setupPromise).then(() => {
  return sandFrame.loadScript('http://myscriptsrc').then((iframeContent) => {
    iframeContent.contentWindow.MyScriptApi();
  }).catch((errorArray) => {
    const error = errorArray[0];
    const iframeContent = errorArray[1];
    console.log(error, iframeContent);
  });
});
```

##Tasks

~~~ bash
# run unit tests
npm test
# with coverage
npm run test-coverage
# linting and verifying coding style
npm run lint
# building library
npm run build
# building a specific distribution version
git checkout v0.1.5 && npm run build
~~~
