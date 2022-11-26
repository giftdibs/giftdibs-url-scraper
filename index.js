const app = require('./src/app');

// The `app` is referenced in firebase.json `rewrites`.
const functions = require('firebase-functions');
exports.app = functions
  .runWith({
    memory: '2GB',
    timeoutSeconds: 300,
  })
  .https.onRequest(app);
