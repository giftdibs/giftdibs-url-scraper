const scraperProductConfigs = require('giftdibs-product-page-scraper/src/product-config');

const urlParser = require('url');

const defaultConfig = {
  nameSelector: 'title',
  priceSelector: null,
  imageSelector: 'img',
};

const getConfig = (url) => {
  const hostname = new urlParser.URL(url).hostname
    .replace('www.', '')
    .replace('www2.', '');
  const config = scraperProductConfigs[hostname] || {};

  return Object.assign({}, defaultConfig, config);
};

module.exports = {
  getConfig,
};
