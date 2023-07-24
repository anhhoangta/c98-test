const app = require('./app');
require('dotenv').config();

// Start the server
let server = app.listen(process.env.PORT, function() {
  console.log('Example app listening on port 3000!');
});

module.exports = server;
