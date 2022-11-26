const mock = require('mock-require');

describe('/scrape-product-url', () => {
  let _req;
  let urlScraper;

  beforeEach(() => {
    _req = {
      query: {
        url: encodeURIComponent('http://foo.com'),
      },
    };
    urlScraper = mock.reRequire('../utils/url-scraper');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should return page content details with the response', () => {
    spyOn(urlScraper, 'getProductDetails').and.returnValue(Promise.resolve({}));
    const routeDefinition = mock.reRequire('./scrape-product-url');
    const scrapeProductUrl = routeDefinition.middleware.scrapeProductUrl[0];
    const res = {
      json(data) {
        expect(data.products[0].name).toBeDefined();
      },
    };
    scrapeProductUrl(_req, res, () => {});
  });

  it('should handle invalid URLs', () => {
    spyOn(urlScraper, 'getProductDetails').and.returnValue(Promise.resolve({}));
    const routeDefinition = mock.reRequire('./scrape-product-url');
    const scrapeProductUrl = routeDefinition.middleware.scrapeProductUrl[0];
    const res = {};
    _req.query.url = undefined;
    scrapeProductUrl(_req, res, (err) => {
      expect(err.code).toEqual(1);
      expect(err.status).toEqual(400);
    });
  });
});
