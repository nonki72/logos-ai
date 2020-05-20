
'use strict';

var express = require('express');
const execFile = require('child_process').execFile;
const DataLib = require('../src/datalib');
const Sql = require('../src/sql');
const Lexer = require('../src/lexer');
const Parser = require('../src/parser');
const Interpreter = require('../src/interpreter');

var router = express.Router();


/*
request parameters:
  expression
  printast
 */
router.post('/evaluate', function evaluateLambdaExpression (req, res, next) {

  const source = req.body.expression + '\0';
  const lexer = new Lexer(source);
  const parser = new Parser(lexer);
  parser.parse(function (ast) {
    if (req.body.printast) {
      const output = util.inspect(ast, {
        depth: null,
        colors: true,
      });
      return res.status(200).json({"result": output});
    } else {
      const callback = (error, stdout, stderr) => {
        if (error)
          return res.status(400).json({"message":error.message});
        if (stderr)
          return res.status(400).json({"message":stderr});
        if (!stdout)
          return res.status(400).json({"message":'Empty evaluation result'});

        const source2 = stdout;
        const lexer2 = new Lexer(source2);
        const parser2 = new Parser(lexer2);
        parser2.parse(function (ast2) {

          if (ast.id) {
            DataLib.readOrCreateSubstitution("beta", ast.id, ast2.id, (substitution) => {

              return res.status(200).json({"result": stdout.slice(0,-1),"createdsub":"true"});
            });
          } else {
            return res.status(200).json({"result": stdout.slice(0,-1)});
          }
        });
      };

//      Interpreter.evaluate(ast, (result) => {
//        console.log(result.toString());
//        return callback(null, result.toString(), null);
//      });
      const lambda = execFile('bin/Lambda', [source], callback);
    }
  });
});


/*
request parameters:
  definition1
  definition2
 */
router.post('/application', (req, res, next) => {console.log(req.body);
  DataLib.readOrCreateApplication(req.body.definition1, req.body.definition2, (application) => {
    if (application == null) {
      return next('Could not create application');
    }
    console.log(application);
    return res.status(200).json({"application":application});
  });
});

/*
request parameters:
  name
  definition2
 */
router.post('/abstraction', (req, res, next) => {
  DataLib.readOrCreateAbstraction(req.body.name, req.body.definition2, (abstraction) => {
    if (abstraction == null) {
      return next('Could not create abstraction');
    }
    return res.status(200).json({"abstraction":abstraction});
  });
});

/*
request parameters:
  index
 */
router.post('/identifier', (req, res, next) => {
  DataLib.readOrCreateIdentifier(req.body.index, (identifier) => {
    if (identifier == null) {
      return next('Could not create identifier');
    }
    return res.status(200).json({"identifier":identifier});
  });
});

/*
request parameters:
  name
 */
router.post('/freeidentifier', (req, res, next) => {
  DataLib.readOrCreateFreeIdentifier(req.body.name, (freeidentifier) => {
    if (freeidentifier == null) {
      return next('Could not create free identifier');
    }
    return res.status(200).json({"freeidentifier":freeidentifier});
  });
});

/*
request parameters:
  type
  definition1
  definition2
 */
router.post('/substitution', (req, res, next) => {
  DataLib.readOrCreateSubstitution(req.body.type, req.body.definition1, req.body.definition2, (substitution) => {
    if (substitution == null) {
      return next('Could not create substitution');
    }
    return res.status(200).json({"substitution":substitution});
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
