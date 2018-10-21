const express = require('express');
const puppeteer = require('puppeteer');

const { Product } = require('../database/models/product');
const { URLScraperNotFoundError } = require('../shared/errors');

const scrapeUrlDomCallback = require('./scrape-product-dom-callback');

const router = express.Router();
const isUrlRegExp = /^https?:\/\//;

async function launchUrl(url, callback, args) {
  const browser = await puppeteer.launch({
    // See: https://github.com/GoogleChrome/puppeteer/issues/2511#issuecomment-387811302
    ignoreDefaultArgs: true,

    headless: true,
    args: [
      '--ignore-certificate-errors',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-gpu',
      '--hide-scrollbars'
    ]
  });

  const page = await browser.newPage();

  if (process.env.NODE_ENV === 'development') {
    page.on('console', (message) => {
      console.log('PAGE LOG:', message.text());
    });
  }

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const requestUrl = request.url();
    let doAbort = false;

    // Ignore loading images.
    if (args.ignoredResources) {
      const found = args.ignoredResources.find((resource) => {
        return (requestUrl.indexOf(resource) > -1);
      });

      if (found) {
        doAbort = true;
      }
    }

    if (doAbort) {
      if (process.env.NODE_ENV === 'development') {
        console.log('IGNORE RESOURCE:', requestUrl);
      }
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.goto(url);

  const result = await page.evaluate(callback, args);

  await browser.close();

  return result;
}

async function scrapeProductUrl(url, config) {
  const products = await Product.find({ url })
    .limit(1)
    .select('images name price url')
    .lean();

  let product = products[0];

  if (!product) {
    const details = await launchUrl(url, scrapeUrlDomCallback, config);
    details.url = url;

    if (details.images.length > 0 || details.price > 0) {
      const doc = new Product(details);
      product = await doc.save();
    }
  }

  return product;
}

router.route('/products').get((req, res, next) => {
  const url = decodeURIComponent(req.query.url);
  const isUrl = isUrlRegExp.test(url);

  if (!isUrl) {
    next(new URLScraperNotFoundError());
    return;
  }

  const scraperConfigUtil = require('../utils/config');
  const productConfig = scraperConfigUtil.getConfig(url);

  scrapeProductUrl(url, productConfig)
    .then((product) => {
      res.json({ product });
    })
    .catch(next);
});

module.exports = {
  router
};
