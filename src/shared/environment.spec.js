const dotenv = require('dotenv');
const logger = require('winston');

describe('environment', () => {
  it('should set env variables from a default config.env file', () => {
    spyOn(dotenv, 'config').and.returnValue({});
    const { getEnvironment } = require('./environment');
    getEnvironment();
    expect(dotenv.config).toHaveBeenCalledWith({ path: 'config.env' });
  });

  it('should set env variables from a provided *.env file', () => {
    spyOn(dotenv, 'config').and.returnValue({});
    const { getEnvironment } = require('./environment');
    getEnvironment('sample.env');
    expect(dotenv.config).toHaveBeenCalledWith({ path: 'sample.env' });
  });

  it('should log a message if the config file is not found', () => {
    spyOn(logger, 'info').and.returnValue();
    spyOn(dotenv, 'config').and.returnValue({
      error: new Error('not found')
    });
    const { getEnvironment } = require('./environment');
    getEnvironment();
    expect(logger.info).toHaveBeenCalledWith('Environment configuration could not be parsed from config.env.');
  });
});
