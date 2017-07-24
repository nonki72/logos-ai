
'use strict';

var express = require('express');
const async = require('async');
const DataLib = require('../src/datalib');
const F = require('../src/function');
const functionParser = require('../src/functionparser');


var router = express.Router();


/**
 * GET /api/function
 *
 * Retrieve a entity.
 */
router.get('/:functionName', function get (req, res, next) {
  DataLib.readFreeIdentifierByName(req.params.functionName, (storedFunction) => {
    if (storedFunction == null) {
      return res.status(404).json({"message":"Stored Function could not be found"});
    }
    return res.status(200).json({"freeIdentifier": storedFunction});
  });
});


/*
request parameters:
  astid
  fn
  fntype
  fnclass
  argnum
  argtypes
  modules
  memoize
  args (test args)
 */
router.post('/:functionName', function createStoredFunction (req, res, next) {
  var storedFunction = new F.StoredFunction(req.body.memoize, req.body.fntype, req.body.fnclass, req.body.argtypes, req.body.modules, req.body.fn);
  functionParser.parseFunction(storedFunction, req.body.args, (msg, err) => {
    if (err) {
      err.message2 = err.message;
      err.message = msg;
      return next(err);
    } else if (msg) {
      return next({message:msg});
    }
    DataLib.readOrCreateFreeIdentifierFunction(req.params.functionName, 
      req.body.astid, req.body.fn, req.body.fntype, req.body.fnclass, req.body.argnum, req.body.argtypes, req.body.modules, req.body.memoize, (freeIdentifier) => {
      if (freeIdentifier == null) {
        return next('Could not create free identifier function \'' + req.params.functionName + '\' already exists');
      }
      return res.status(200).json({"storedfunction":freeIdentifier});
    });
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
    internalCode: err.code,
  };
  delete err.message;
  next(err);
});

module.exports = router;
