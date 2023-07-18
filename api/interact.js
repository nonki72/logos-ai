
'use strict';

var express = require('express');
const async = require('async');
const InteractStub = require('../src/interact-stub');

var router = express.Router();


/**
 * GET /api/interact
 *
 * Retrieve a entity.
 */
router.get('/:input', function get (req, res, next) {
    InteractStub.interact(req.params.input, (output) => {
        if (output == null) {
            return res.status(404).json({"message":"No output for input: " + req.params.input});
        }
        return res.status(200).json({"output": output});
    });
});


/**
 * Errors on "/api/interact/*" routes.
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
