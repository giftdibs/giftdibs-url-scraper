const env = require('./shared/environment');
env.applyEnvironment();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.set('port', env.get('PORT'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const allowedOrigins = env.get('ALLOW_ORIGINS');
if (!allowedOrigins) {
  console.error('Please provide allowed origins.');
  process.exit(1);
}

const whitelist = allowedOrigins.split(',');

app.use(
  cors({
    methods: 'GET,POST,OPTIONS',
    optionsSuccessStatus: 200,
    origin: (origin, callback) => {
      // No origin means "same origin":
      // See: https://github.com/expressjs/cors/issues/118
      if (origin === undefined || whitelist.indexOf(origin) !== -1) {
        console.log(`The domain ${origin} is allowed access.`);
        callback(null, true);
      } else {
        callback(new Error(`The domain ${origin} is not allowed access.`));
      }
    },
  })
);
app.options('*', cors());

app.use('/v1', require('./routes'));

app.use(require('./middleware/404'));
app.use(require('./middleware/error-handler'));

module.exports = app;
