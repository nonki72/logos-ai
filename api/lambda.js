
'use strict';

var express = require('express');
var bodyParser = require('body-parser');
const async = require('async');
const DataLib = require('../src/datalib');
const Lexer = require('../src/lexer');
const Parser = require('../src/parser');
const Interpreter = require('../src/interpreter');

var router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json());


/*
request parameters:
  expression
  printast
 */
router.post('/evaluate', function evaluateLambdaExpression (req, res, next) {
  const lexer = new Lexer(req.body.expression);
  const parser = new Parser(lexer);
  parser.parse(function (ast) {
    if (req.body.printast) {
      const output = util.inspect(ast, {
        depth: null,
        colors: true,
      });
      return res.status(200).json({"result": output});
    } else {
      Interpreter.evaluate(ast, (result) => {
        if (result) {
          return res.status(200).json({"result": result.toString()});
        }
      });
    }

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
