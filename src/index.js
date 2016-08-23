export default function (global) {
  function create() {
    return new Promise((resolve, reject) => {
      const { document: topDocument } = global;
      const sandbox = topDocument.createElement('iframe');
      const sandboxStyle = sandbox.style;
      sandboxStyle.visibility = 'hidden';
      sandboxStyle.display = 'none';

      try {
        topDocument.body.appendChild(sandbox);
        const { contentDocument } = sandbox;
        contentDocument.open();
        contentDocument.close();
        resolve(sandbox);
      } catch (err) {
        reject(err);
      }
    });
  }

  function removeScriptFromSandbox(sandbox, src) {
    const { contentDocument } = sandbox;
    const elements = contentDocument.querySelectorAll(`script[src='${src}']`);
    for (let i = 0; i < elements.length; i++) {
      elements[i].remove();
    }
  }

  const sandboxPromise = create();

  return {
    setup: (setupFunction) => {
      return sandboxPromise.then((sandbox) => {
        return new Promise((resolve, reject) => {
          Promise.resolve(setupFunction(sandbox)).then(() => {
            resolve(sandbox);
          }).catch(() => {
            reject(new Error('could not setup sandbox'));
          });
        });
      });
    },
    loadScript: (src) => {
      return sandboxPromise.then((sandbox) => {
        removeScriptFromSandbox(sandbox, src);

        return new Promise((resolve, reject) => {
          const { contentDocument } = sandbox;
          const script = contentDocument.createElement('script');
          script.src = src;
          script.onload(() => {
            resolve(sandbox);
          });
          script.onerror((error) => {
            reject([error, sandbox]);
          });

          contentDocument.getElementsByTagName('head')[0].appendChild(script);
        });
      });
    }
  };
}
