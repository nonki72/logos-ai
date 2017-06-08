const AST = require('./ast');
const DataLib = require('./datalib');

const isValue = node => node instanceof AST.Abstraction;
const isName = node => node instanceof AST.Identifier;

const typecheck = (abstraction, input) => {
  // type checking of the abs and input
  if (abstraction.type == 'free') {
    // we have a free variable with arbitrary code in .fn
    // or an ast in .astid (don't need to typecheck)
    if (abstraction.fn) {
      if (abstraction.argCount == 0) return false;
      if (abstraction.args) {
        // abstraction already has args. check if does not match 'next' arg
        var inputType = (input.type == 'free') ? typeof input.fn : input.type;
        if (abstraction.argTypes[abstraction.args.length] != inputType) return false;
      } else if (abstraction.argTypes[0] != typeof input) return false;
    }
  }
  return true;
}

const getAstIfNeeded = (entity, cb) => {
  if (entity.type == 'free' && entity.astid) {
    DataLib.readById(entity.astid, (entity2) => {
      return cb(entity2)
    });
  } else {
    return cb(abstraction);
  }
}

const apply = (abstraction, input, lastAst) => {
  if (!typecheck(abstraction, input)) {
    // can't apply these two
    return combine(lastAst);
  }
  // create an application of the two entities
  getAstIfNeeded(abstraction, (abstractionAst) => {
    getAstIfNeeded(input, (inputAst) => {
      DataLib.readOrCreateApplication(abstractionAst.id, inputAst.id, (application) => {
        var applicationAst = new AST.Application(abstractionAst, inputAst);
        return evaluate(applicationAst, (astOut) => {
          return combine(astOut);
          // TODO: write associative value
        });
      });
    });
  });
}
// higher level evaluator that combines together all of the 
// expression fragments in the database into a single set of
// possible evaluation points by use of associative value to 
// make selections. also writes associative values
const combine = (lastAst) => {
  // TODO: get input
  DataLib.readByAssociativeValue((input) => {
    // TODO: run associative value selection math
    // see if lastAst is usable as an abstraction to apply to the input
    if (lastAst.type == 'abs' || (lastAst.type == 'free' && lastAst.argCount && lastAst.argCount > (lastAst.args.length))) {
      return apply(lastAst, input, lastAst);
    }
    // TODO: get entry in diary
    // get a pseudo-random abstraction
    DataLib.readAbstractionByAssociativeValue((abstraction) => {
      return apply(abstraction, input, lastAst);
    });
  });
}

// evaluates the (extended) lambda calculus expression given
// and returns the reduced (extended) lambda calculus expression
// executing any complete applications of functional (JS) identifiers
// TODO: make turbo substitutions using EC
const evaluate = (ast, cb) => {
    if (ast instanceof AST.Application) {
      if (isValue(ast.lhs) && isValue(ast.rhs)) {
        /**
         * if both sides of the application are values we can proceed and
         * substitute the rhs value for the variables that reference the
         * abstraction's parameter in the evaluation body and then evaluate the
         * abstraction's body
         */
        substitute(ast.rhs, ast.lhs.body, function(ast2) {
          evaluate(ast2, cb);
          DataLib.createSubstitution("beta", ast.id, ast2.id, (substitution) => {
          });
        });
      } else if (isValue(ast.lhs)) {
        /**
         * We should only evaluate rhs once lhs has been reduced to a value
         */
        ast.rhs = evaluate(ast.rhs, cb);
      } else if (isName(ast.lhs) && ast.lhs.fn) {
        /**
         * lhs is a named function that requires 0 or more args
         */
        if (ast.lhs.args.length < ast.lhs.argCount) {
          // curry in one more arg
          tryExtractArg(ast, (astOut) => {
            if (astOut.args.length == astOut.argCount) {
              // if all args present, run the named function
              // and substitute the expression
              if (typeof astOut.fn == 'string') {
                astOut.fn = eval(astOut.fn);  // <= CODE EXECUTION
              }
              var output = astOut.fn.apply(null, astOut.args);  // <= CODE EXECUTION
              return cb(output);
              // TODO: write substitution to Diary
            }
            evaluate(astOut, cb);
          });
        } else {
          // has enough args, execute
          if (typeof ast.lhs.fn == 'string') {
            ast.lhs.fn = eval(ast.lhs.fn);  // <= CODE EXECUTION
          }
          var output = ast.lhs.fn.apply(null, ast.lhs.args);  // <= CODE EXECUTION
          ast.lhs = output;
          return cb(ast);
          // TODO: write substitution to Diary
        }
      } else {
        /**
         * Keep reducing lhs until it becomes a value
         */
        ast.lhs = evaluate(ast.lhs, (result) => {
          ast.lhs = result;
          evaluate(ast, cb);
        });
      }
    } else if (isValue(ast)) {
      /**
       * * `ast` is a value, and therefore an abstraction. That means we're done
        * reducing it, and this is the result of the current evaluation.
        */
      return cb(ast);
    }
};

const tryExtractArg = (ast, cb) => {
  // expected arg type is either a JS type or "ast"
  var expectedArgType = ast.lhs.argTypes[ast.lhs.args.length];
  // fn attribute of identifier is js code
  if (ast.rhs.fn && typeof ast.rhs.fn == expectedArgType) {
    ast.lhs.args = ast.lhs.args.concat(ast.rhs.fn);
    return cb(ast.lhs);
  } else if (expectedArgType == "ast") {
    // if rhs is an identifier with embedded ast expression, use that
    if (isName(ast.rhs) && ast.rhs.astid) {
      ast.lhs.args = ast.lhs.args.concat(ast.rhs.astid);
    } else {
      // rhs is itself an ast expression
      ast.lhs.args = ast.lhs.args.concat(ast.rhs);
    }
    return cb(ast.lhs);
  } else {
    // rhs is not expected arg type
    // evaluate rhs (once) and try again
    evaluate(ast.rhs, (astRight) => {
      ast.rhs = astRight;
      tryExtractArg(ast, (astOut) => {
        return cb(astOut);
      });
    });
  }
}

const traverse = fn =>
  function(node, ...args) {
    const config = fn(...args);
    if (node instanceof AST.Application)
      return config.Application(node);
    else if (node instanceof AST.Abstraction)
      return config.Abstraction(node);
    else if (node instanceof AST.Identifier)
      return config.Identifier(node);
  }

const shift = (by, node, cb) => {
  const aux = traverse((from, cb2) => ({
    Application(app) {
      aux(app.lhs, from, function(node1){
        aux(app.rhs, from, function(node2) {
          var applicationAst = new AST.Application(
            node1,
            node2
          );
          DataLib.readOrCreateApplication(app.lhs.id, app.rhs.id, (application) => {
            applicationAst.id = application.id;
            return cb2(applicationAst);
          });
        });
      });
    },
    Abstraction(abs) {
      aux(abs.body, from + 1, function(node1) {
        var abstractionAst = new AST.Abstraction(
          abs.param,
          node1
        );
        DataLib.readOrCreateAbstraction(abs.param, abs.body.id, (abstraction) => {
          abstractionAst.id = abstraction.id;
          return cb2(abstractionAst);
        });
      });
    },
    Identifier(id) {
      var identifierAst = new AST.Identifier(
        id.value + (id.value >= from ? by : 0)
      );
      DataLib.readOrCreateIdentifier(id.value, (identifier) => {
        identifierAst.id = identifier.id;
        return cb2(identifierAst);
      });
    }
  }));
  aux(node, 0, function(node1) {
    return cb(node1);    
  });
};

const subst = (value, node, cb) => {
  const aux = traverse((depth,cb2) => ({
    Application(app) {
      aux(app.lhs, depth, function(node1){
        aux(app.rhs, depth, function(node2) {
          var applicationAst = new AST.Application(
            node1,
            node2
          );
          DataLib.readOrCreateApplication(app.lhs.id, app.rhs.id, (application) => {
            applicationAst.id = application.id;
            return cb2(applicationAst);
          });
        });
      });
    },
    Abstraction(abs) {
      aux(abs.body, depth + 1, function(node1) {
        var abstractionAst = new AST.Abstraction(
          abs.param,
          node1
        );
        DataLib.readOrCreateAbstraction(abs.param, abs.body.id, (abstraction) => {
          abstractionAst.id = abstraction.id;
          return cb2(abstractionAst);
        });
      });
    },
    Identifier(id) {
      if (depth === id.value)
        return shift(depth, value, function(result) {
          cb2(result);
        });
      else
        return cb2(id);
    }
  }));
  aux(node, 0, function(node1) {
    return cb(node1);    
  });
};

const substitute = (value, node, cb) => {
  shift(1, value, function(node1){
    subst(node1, node, function(node2){
      shift(-1, node2, function(node3){
        return cb (node3);
      });
    })    
  })
};

exports.evaluate = evaluate;
