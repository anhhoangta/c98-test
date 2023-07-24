const app = require('./app');

// ... your Express app configuration ...

// Start the server
let server = app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});

// Export the running server instance
module.exports = server;
