
'use strict';

var express = require('express');
const async = require('async');
const DataLib = require('../src/datalib');

var router = express.Router();


/**
 * GET /api/frequency
 *
 * Retrieve a entity.
 */
router.get('/', function get (req, res, next) {
    DataLib.readWordFrequency(req.query.wordName, (word) => {
        if (word == null) {
            return res.status(404).json({"message":"Word frequency could not be found: " + req.query.wordName});
        }
        return res.status(200).json({"word": word});
    });
});

/**
 * GET /api/frequency/all
 *
 * Retrieve all entities.
 */
router.get('/', function get (req, res, next) {
    DataLib.readWordFrequencyAll((words) => {
        if (words == null) {
            return res.status(404).json({"message":"Words could not be found in wordfreq db"});
        }
        return res.status(200).json({"words": words.cursor()});
    });
});


/**
 * GET /api/frequency/atleast
 *
 * Retrieve a entity that is at least a frequency.
 */
router.get('/atleast/', function get (req, res, next) {
    DataLib.readWordFrequencyAtLeast(req.query.frequency, (word) => {
        if (word == null) {
            return res.status(404).json({"message":"Word could not be found with frequency at least: " + req.query.frequency});
        }
        return res.status(200).json({"word": word});
    });
});


/*
request parameters:
  freq
 */
router.post('/', function createWordFrequency (req, res, next) {
    DataLib.readOrCreateWordFrequency(req.query.wordName, req.body.freq, (word) => {
            if (word == null) {
                return next({message: 'Could not create word frequency \'' + req.query.wordName});
            }
            console.log(req.body);
            return res.status(200).json({"word": word});
        });
});


/**
 * Errors on "/api/frequency/*" routes.
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
