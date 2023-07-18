
'use strict';

var express = require('express');
const DataLib = require('../src/datalib');

var router = express.Router();


/**
 * GET /api/class
 *
 * Retrieve a entity.
 */
router.get('/', function get (req, res, next) {
  DataLib.readClassByNameAndModule(req.query.className, req.query.moduleName, (klass) => {
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
router.post('/', function createClass (req, res, next) {
  DataLib.readOrCreateClass(req.query.className, req.body.module, (klass) => {
    if (klass == null) {
      return next('Could not create class \'' + req.query.className + '\' already exists');
    }
    return res.status(200).json({"class":klass});
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
