const env = require('../shared/environment');
const NODE_ENV = env.get('NODE_ENV');

let PAGE;

function getPuppeteer() {
  // if (NODE_ENV !== 'development') {
  //   return require('puppeteer-core');
  // }

  return require('puppeteer');
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
      '--no-zygote=true',
    ],
  };
}

async function getPage() {
  const options = await getPuppeteerOptions();

  const browser = await getPuppeteer().launch(options);

  if (PAGE) {
    return PAGE;
  }

  PAGE = await browser.newPage();

  // See: https://intoli.com/blog/making-chrome-headless-undetectable/
  // Use Safari, so that some sites won't serve webp images (like Target.com).
  // await page.setUserAgent(
  //   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.1 Safari/605.1.15'
  // );

  if (NODE_ENV === 'development') {
    PAGE.on('console', (message) => {
      console.log('PAGE LOG:', message.text());
    });
  }

  PAGE.setViewport({
    width: 1600,
    height: 1200,
  });

  await PAGE.setRequestInterception(true);
  await PAGE.setBypassCSP(true);

  PAGE.on('request', (request) => {
    const requestUrl = request.url();
    const resourceType = request.resourceType();

    const blockedResourceTypes = [
      'media',
      'font',
      'texttrack',
      'object',
      'beacon',
      'csp_report',
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
      'twitter',
    ];

    const doAbort =
      blockedResourceTypes.indexOf(resourceType) !== -1 ||
      ignoredResources.find((r) => requestUrl.indexOf(r) !== -1);

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

  return PAGE;
}

module.exports = getPage;
