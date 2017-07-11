
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
const DataLib = require('../src/datalib');

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());


/**
 * GET /api/module
 *
 * Retrieve a entity.
 */
router.get('/:moduleName', function get (req, res, next) {
  DataLib.readModuleByName(req.params.moduleName, (module) => {
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
router.post('/:moduleName', function createModule (req, res, next) {
  DataLib.readOrCreateModule(req.params.moduleName, req.body.path, (module) => {
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
