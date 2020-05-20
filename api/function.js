
'use strict';

var express = require('express');
const async = require('async');
const DataLib = require('../src/datalib');
const F = require('../src/function');
const functionParser = require('../src/functionparser');
const AST = require('../src/ast');

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
  argnum (if non null and fntype=identifier then this describes a function and fnclass is the return type)
  argtypes
  modules
  memoize
  testargs
 */
router.post('/:functionName', function createStoredFunction (req, res, next) {
  var storedFunction = new F.StoredFunction(req.body.memoize, req.body.fntype, req.body.fnclass, req.body.argtypes, req.body.modules, req.body.fn);

            console.log("????"+JSON.stringify(req.body,null,4))
  if (req.body.argtypes != null && req.body.argtypes.length > 0) {
    for (var i=0; i<req.body.argtypes.length;i++) {
      if (req.body.argtypes[i][1]=='AST') {
        req.body.testargs[i] = AST.cast(req.body.testargs[i]);
      }
    }
  }
  functionParser.parseFunction(storedFunction, req.body.testargs, (err) => {
    if (err) {
      var error = {};
      error.message = err + " ... " + JSON.stringify(req.body);
      return next(error);
    }
    DataLib.readOrCreateFreeIdentifierFunction(req.params.functionName, 
      null, req.body.fn, req.body.fntype, req.body.fnclass, req.body.argnum, req.body.argtypes, req.body.modules, req.body.memoize, (freeIdentifier) => {
      if (freeIdentifier == null) {
        return next({message: 'Could not create free identifier function \'' + req.params.functionName});
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
