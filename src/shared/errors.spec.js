describe('error', () => {
  it('should return error constructors', () => {
    const { URLScraperNotFoundError } = require('./errors');

    expect(typeof URLScraperNotFoundError).toEqual('function');

    const err = new URLScraperNotFoundError();
    expect(err.code).toEqual(1);
    expect(err.status).toEqual(400);
  });
});
