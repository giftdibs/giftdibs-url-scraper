const mock = require('mock-require');

describe('app', () => {
  beforeEach(() => {
    mock('./shared/environment', {
      getEnvironment() {},
    });
    mock('express', () => {
      return {
        set: () => {},
        use: () => {},
        port: () => {},
      };
    });
    mock('./routes', {});
    mock('./middleware/404', {});
    mock('./middleware/error-handler', {});
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should export an ExpressJS app object', () => {
    const app = mock.reRequire('./app');
    expect(app).toBeDefined();
    expect(typeof app.port).toEqual('function');
  });

  it('should configure cors', () => {
    mock('cors', (config) => {
      expect(config.origin).toEqual('http://localhost:4200');
      expect(config.methods).toEqual('GET,OPTIONS');
    });
    mock.reRequire('./app');
  });
});
