function URLScraperNotFoundError() {
  this.name = 'URLScraperNotFoundError';
  this.message = 'Please provide a valid URL.';
  this.code = 1;
  this.status = 400;
}

URLScraperNotFoundError.prototype = Error.prototype;

module.exports = {
  URLScraperNotFoundError,
};
