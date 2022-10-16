'use strict';

var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

// Automatically parse request body as JSON
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json({
  strict:false
}));

app.disable('etag');
app.set('trust proxy', true);

app.get('/health', function get (req, res, next) {
  return res.status(200).json({"status": "ok"});
});

app.use('/api/function', require('./api/function'));
app.use('/api/class', require('./api/class'));
app.use('/api/module', require('./api/module'));
app.use('/api/lambda', require('./api/lambda'));
app.use('/api/ec', require('./api/ec'));
app.use('/api/frequency', require('./api/frequency'));

// Basic 404 handler
app.use(function (req, res) {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use(function (err, req, res, next) {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

if (module === require.main) {
  // Start the server
  var server = app.listen(9001, function () {
    var port = server.address().port;
    console.log('App listening on port %s', port);
  });
}

module.exports = app;
