
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
const DataLib = require('../src/datalib');

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());


/**
 * GET /api/class
 *
 * Retrieve a entity.
 */
router.get('/:className', function get (req, res, next) {
  DataLib.readClassByName(req.params.className, (klass) => {
    if (klass == null) {
      return res.status(404).json({"message":"Class could not be found"});
    }
    return res.status(200).json({"class": klass});
  });
});

/*
request parameters:
  module
 */
router.post('/:className', function createClass (req, res, next) {
  DataLib.createClass(req.params.className, req.body.module, (klass) => {
    if (klass == null) {
      return next('Could not create class \'' + req.params.className + '\' already exists');
    }
    return res.status(200).json({"message":"Class created."});
  });
});



/**
 * Errors on "/api/function/*" routes.
 */
router.use(function handleRpcError (err, req, res, next) {
  // Format error and forward to generic error handler for logging and
  // responding to the request
  err.response = {
    message: err.message,
    internalCode: err.code
  };
  next(err);
});

module.exports = router;
