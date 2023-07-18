
'use strict';

var express = require('express');
const DataLib = require('../src/datalib');

var router = express.Router();

/**
 * GET /api/module
 *
 * Retrieve a entity.
 */
router.get('/', function get (req, res, next) {
  DataLib.readModuleByName(req.query.moduleName, (module) => {
    if (module == null) {
      return res.status(404).json({"message":"Module could not be found"});
    }
    return res.status(200).json({"module": module});
  });
});

/*
request parameters:
  path
 */
router.post('/', function createModule (req, res, next) {
  DataLib.readOrCreateModule(req.query.moduleName, req.body.path, (module) => {
    if (module == null) {
      return next('Could not create module \'' + req.params.moduleName);
    }
    return res.status(200).json({"module":module});
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
