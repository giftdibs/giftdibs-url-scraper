module.exports = (err, req, res, next) => {
  const statusCode = err.status || 500;

  const result = {
    message: err.message,
    code: err.code || 0,
  };

  // Do not pass 500 errors to the client!
  if (statusCode === 500) {
    result.message = 'Something bad happened.';
    // TODO: Create production-level logger for issue tracking.
    console.log(err);
  }

  res.status(statusCode).json(result);
};
