const express = require('express');
const scrapeProductPage = require('giftdibs-product-page-scraper/src/scrape-product-page');

const env = require('../shared/environment');
const NODE_ENV = env.get('NODE_ENV');
const { URLScraperNotFoundError } = require('../shared/errors');

const router = express.Router();
const isUrlRegExp = /^https?:\/\//;

function getPuppeteer() {
  // if (NODE_ENV !== 'development') {
  //   return require('puppeteer-core');
  // }

  return require('puppeteer-core');
}

async function getPuppeteerOptions() {
  // if (NODE_ENV !== 'development') {
  //   // Use chrome-aws-lambda in production; it's much faster.
  //   // See: https://github.com/GoogleChrome/puppeteer/issues/3120#issuecomment-450575911
  //   const chromium = require('chrome-aws-lambda');
  //   return {
  //     args: chromium.args,
  //     defaultViewport: chromium.defaultViewport,
  //     executablePath: await chromium.executablePath,
  //     headless: chromium.headless
  //   };
  // }

  return {
    headless: true,
    args: [
      '--disable-gpu=true',
      '--disable-accelerated-2d-canvas=true',
      '--disable-dev-shm-usage=true',
      '--disable-setuid-sandbox=true',
      '--disable-web-security=true',
      '--hide-scrollbars=true',
      '--ignore-certificate-errors=true',
      '--no-first-run=true',
      '--no-sandbox=true',
      '--no-zygote=true'
    ]
  };
}

async function launchUrl(url, callback, args) {
  const options = await getPuppeteerOptions();

  const browser = await getPuppeteer().launch(options);

  const page = await browser.newPage();

  // See: https://intoli.com/blog/making-chrome-headless-undetectable/
  // Use Safari, so that some sites won't serve webp images (like Target.com).
  // await page.setUserAgent(
  //   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.1 Safari/605.1.15'
  // );

  if (NODE_ENV === 'development') {
    page.on('console', (message) => {
      console.log('PAGE LOG:', message.text());
    });
  }

  page.setViewport({
    width: 1600,
    height: 1200
  });

  await page.setRequestInterception(true);
  await page.setBypassCSP(true);

  page.on('request', (request) => {
    const requestUrl = request.url();
    const resourceType = request.resourceType();

    const blockedResourceTypes = [
      'media',
      'font',
      'texttrack',
      'object',
      'beacon',
      'csp_report'
    ];

    const ignoredResources = [
      'adservice.google',
      'addthis',
      'advertising',
      'akamaihd',
      'bazaarvoice',
      'bing',
      'bluekai',
      'boldchat',
      'bounceexchange',
      'clicktale',
      'doubleclick',
      'facebook',
      'facebook',
      'go-mpulse',
      'googleadservices',
      'googletagmanager',
      'googletagservices',
      'google-analytics',
      'adsense',
      'mixpanel',
      'optimizely',
      'pinterest',
      'snapchat',
      'twitter'
    ];

    const doAbort = (
      blockedResourceTypes.indexOf(resourceType) !== -1 ||
      ignoredResources.find(r => requestUrl.indexOf(r) !== -1)
    );

    if (doAbort) {
      if (NODE_ENV === 'development') {
        console.log('IGNORE RESOURCE:', requestUrl);
      }

      request.abort();
      return;
    }

    if (NODE_ENV === 'development') {
      console.log('ALLOW:', requestUrl);
    }

    request.continue();
  });

  await page.goto(url, {
    waitUntil: 'load'
  });

  const result = await page.evaluate(callback, args);

  await browser.close();

  return result;
}

async function scrapeProductUrl(url, config) {
  const details = await launchUrl(url, scrapeProductPage, config);

  details.url = url;

  return details;
}

router.route('/products').get((req, res, next) => {
  const url = decodeURIComponent(req.query.url);
  const isUrl = isUrlRegExp.test(url);

  if (!isUrl) {
    next(new URLScraperNotFoundError());
    return;
  }

  const { getConfig } = require('../utils/config');
  const productConfig = getConfig(url);

  scrapeProductUrl(url, productConfig)
    .then((product) => {
      res.json({ product });
    })
    .catch(next);
});

module.exports = {
  router
};
