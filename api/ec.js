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
  var equid = await Sql.incrementECRecord(req.body.sourceid, req.body.destinationid);
  if (equid == null) {
    return next('Could not create association');
  }
  return res.status(200).json({"equid":equid});
});

/*
request parameters:
  sourceid
  destinationid
  assv
 */
  router.post('/adjust', async (req, res, next) => {
    var ec = {
      srcid: req.body.sourceid,
      dstid: req.body.destinationid,
      assv: req.body.assv
    };
    var equid1 = await Sql.insertECRecord(srcid);
    if (equid1 == null) {
      return next('Could not create first EC record');
    }

    var equid2 = await Sql.insertECRecord(dstid, equid1);
    if (equid2 == null) {
      return next('Could not create second EC record');
    }
    return res.status(200).json({"equid1":equid1,"equid2":equid2});
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
