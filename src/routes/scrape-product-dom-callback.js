/* eslint-env browser */
// This method is executed in the DOM.
module.exports = (config) => {
  const isUrlRegExp = /^https?:\/\//;

  let nameElement;
  if (config.nameSelector) {
    nameElement = document.querySelector(config.nameSelector);
  }

  let name = '';
  if (nameElement) {
    name = nameElement.textContent.trim();
  }

  let priceElement;
  if (config.priceSelector) {
    priceElement = document.querySelector(config.priceSelector);
  }

  let price = 0;
  if (priceElement) {
    price = priceElement.textContent.trim().replace('$', '').replace(/ /g, '');
    price = parseFloat(price);
    price = Math.round(price);

    if (isNaN(price)) {
      price = 0;
    }
  }

  // Fall back to all images if the special selector fails.
  let imageElements = document.querySelectorAll(config.imagesSelector);
  if (imageElements.length === 0) {
    imageElements = document.querySelectorAll('img');
  }

  let images = [];

  imageElements.forEach((element) => {
    const src = element.src;

    if (src) {
      const isValidUrl = (isUrlRegExp.test(src) || src.indexOf('data:image') === 0);
      if (isValidUrl) {
        const rect = element.getBoundingClientRect();
        if (
          (rect.width >= 200 && rect.height >= 50) ||
          (rect.height >= 200 && rect.width >= 50)
        ) {
          images.push({ url: src });
        }
      }
    }
  });

  // Limit number of images saved.
  if (images.length > 25) {
    images = images.slice(0, 24);
  }

  // https://stackoverflow.com/a/20285053/6178885
  function toDataUrl(url) {
    return new Promise((resolve) => {
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result);
        }
        reader.readAsDataURL(xhr.response);
      };
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    });
  }

  const promises = images.map((image) => {
    if (image.url.indexOf('data:') === 0) {
      return image.url;
    }

    return toDataUrl(image.url);
  });

  return Promise.all(promises)
    .then((result) => {
      return {
        images: result.map((r) => ({ data: r })),
        name,
        price
      };
    });
};