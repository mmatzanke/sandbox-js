import SandFrame from '../../src/index.js';
import sinon from 'sinon';
import expect from 'unexpected';

describe('Sandbox', () => {
  let sandframe;
  let global;
  let sandboxIframe;
  let sinonSandbox;
  let scriptElement;
  let querySelectorArray;

  beforeEach(() => {
    sinonSandbox = sinon.sandbox.create();
    scriptElement = {
      onload: sinonSandbox.spy((onloadhandler) => {
        onloadhandler();
      }),
      onerror: sinonSandbox.spy((onerrorhandler) => {
        onerrorhandler();
      })
    };
    querySelectorArray = [];
    sandboxIframe = {
      style: {},
      contentDocument: {
        open: sinonSandbox.spy(),
        write: sinonSandbox.spy(),
        close: sinonSandbox.spy(),
        querySelectorAll: sinonSandbox.spy(() => {
          return querySelectorArray;
        }),
        createElement: sinonSandbox.spy(type => {
          let element;
          if (type === 'script') {
            element = scriptElement;
          }
          return element;
        }),
        body: {
          appendChild: sinonSandbox.spy()
        },
        getElementsByTagName: sinonSandbox.spy(() => {
          return [{
            appendChild: sinonSandbox.spy((element) => {
              if (element.onload) {
                element.onload();
              }
            })
          }];
        })
      },
      contentWindow: {}
    };

    global = {
      Math: {
        random: () => {
          return 0.3380363835067117;
        },
        floor: Math.floor
      },
      addEventListener: sinonSandbox.spy(),
      document: {
        body: {
          appendChild: sinonSandbox.spy()
        },
        createElement: sinonSandbox.spy(type => {
          let element;
          if (type === 'iframe') {
            element = sandboxIframe;
          }
          return element;
        })
      }
    };
    sandframe = new SandFrame(global);
  });

  afterEach(() => {
    sinonSandbox.restore();
  });

  it('returns a proper interface', () => {
    expect(sandframe.setup, 'to be a function');
    expect(sandframe.loadScript, 'to be a function');
  });

  describe('.setup', () => {
    it('calls the given sync setupFunction with the sandboxIframe as parameter and' +
       'resolves the resulting promise with the updated sandbox', () => {
      const changedValue = 'myChangedValue';
      const setupFunctionSync = sinonSandbox.spy(sandbox => {
        const { contentWindow } = sandbox;
        contentWindow.changedValue = changedValue;
      });
      return sandframe.setup(setupFunctionSync).then(updatedSandbox => {
        expect(setupFunctionSync.firstCall.args[0], 'to be', sandboxIframe);
        expect(setupFunctionSync.callCount, 'to be', 1);
        expect(updatedSandbox.contentWindow.changedValue, 'to be', changedValue);
      });
    });

    it('rejects if the given sync setupFunction is throws an error', () => {
      const setupFunctionAsync = sinonSandbox.stub().throws();
      return expect(sandframe.setup(setupFunctionAsync), 'to be rejected');
    });

    it('calls the given async promised setupFunction with the sandboxIframe as parameter and' +
       'resolves the resulting promise with updated sandbox', () => {
      const changedValue = 'myChangedValue';
      const setupFunctionAsync = sinonSandbox.spy(() => {
        const { contentWindow } = sandboxIframe;
        contentWindow.changedValue = changedValue;
        return Promise.resolve();
      });
      return sandframe.setup(setupFunctionAsync).then(updatedSandbox => {
        expect(setupFunctionAsync.firstCall.args[0], 'to be', sandboxIframe);
        expect(setupFunctionAsync.callCount, 'to be', 1);
        expect(updatedSandbox.contentWindow.changedValue, 'to be', changedValue);
      });
    });

    it('rejects if the given async promised setupFunction rejects', () => {
      const setupFunctionAsync = sinonSandbox.spy(() => {
        return Promise.reject();
      });
      return expect(sandframe.setup(setupFunctionAsync), 'to be rejected');
    });
  });

  describe('.loadScript', () => {
    let data;
    let src;

    beforeEach(() => {
      src = 'http://mysrcdomain/mysrc.file';
      global.addEventListener = sinonSandbox.spy((eventName, callback) => { callback({ data }); });
    });

    it('removes scripts from DOM that are triggered to be loaded again', () => {
      const scriptDOMNodeToBeDeleted = {
        remove: sinonSandbox.spy()
      };
      return sandframe.loadScript(src).then(() => {
        querySelectorArray.push(scriptDOMNodeToBeDeleted);
        return sandframe.loadScript(src).then(() => {
          const { contentDocument: { querySelectorAll } } = sandboxIframe;
          expect(querySelectorAll.callCount, 'to be', 2);
          expect(querySelectorAll.alwaysCalledWith(`script[src='${src}']`), 'to be', true);
          expect(scriptDOMNodeToBeDeleted.remove.callCount, 'to be', 1);
        });
      });
    });

    describe('with script.onload loading event', () => {
      it('resolves to the sandboxIframe itself', () => {
        return sandframe.loadScript(src).then(updatedSandBox => {
          expect(updatedSandBox, 'to be', sandboxIframe);
        });
      });
    });

    describe('with script.onerror event', () => {
      let loadingError;

      beforeEach(() => {
        loadingError = new Error('could not load');
        scriptElement.onload = () => {};
        scriptElement.onerror = (onerrorhandler) => {onerrorhandler(loadingError);};
        src = 'http://mysrcdomain/mysrc.file';
      });

      it('rejects to an array [error, sandboxIframe]', () => {
        return sandframe.loadScript(src).catch(args => {
          const err = args[0];
          const sandbox = args[1];
          expect(err, 'to be', loadingError);
          expect(sandbox, 'to be', sandboxIframe);
        });
      });
    });
  });
});
