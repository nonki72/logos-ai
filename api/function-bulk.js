
'use strict';

var express = require('express');
const async = require('async');
const DataLib = require('../src/datalib');
const F = require('../src/function');
const functionParser = require('../src/functionparser');
const AST = require('../src/ast');

var router = express.Router();





/**
 * GET /api/function-bulk/:regex
 *
 * Retrieve more entities.
 */
router.get('/regex/:regex', async function get (req, res, next) {
  const regex = req.params.regex;
  
  // Get the cursor value from the request query parameter
  const cursor = req.query.cursor;

  // Get the page size from the request query parameter
  const pageSize = parseInt(req.query.pageSize) || 10;

  // Paginate the results using the DAO
  const { documents, nextCursor } = await DataLib.readFreeIdentifiersByRegex(regex, cursor, pageSize);

  if (storedFunctions == null) {
    return res.status(404).json({"message":"Stored Functions could not be found"});
  }
  return res.status(200).json({
    "freeIdentifiers": documents,
    "nextCursor":nextCursor,
  });
});









/**
 * Errors on "/api/function-bulk/*" routes.
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
