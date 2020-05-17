'use strict';

var express = require('express');
const DataLib = require('../src/datalib');
const Sql = require('../src/sql');

var router = express.Router();

/*
request parameters:
  sourceid
  destinationid
 */
router.post('/increment', async (req, res, next) => {
  var ec = {
    srcid: req.body.sourceid,
    dstid: req.body.destinationid
  };
  var result = await Sql.incrementECRecord(req.body.sourceid, req.body.destinationid);
  if (result == null) {
    return next('Could not create association');
  }
  return res.status(200).json({"association":association});
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
