const AST = require('./ast');
const DataLib = require('./datalib');
const Sql = require('./sql');

const isValue = node => node instanceof AST.Abstraction || ('data' in node && node.data.type == 'abs');
const isName = node => node instanceof AST.Identifier || ('data' in node && (node.data.type == 'id')); // TODO: add field to free denoting name or value
const isApp = node => node instanceof AST.Application || ('data' in node && node.data.type == 'app');

// determines whether the abstraction (function to call) is accepting one more
// parameter, and the input given matches the expected type 
const typecheck = (abstraction, input) => {
  if (abstraction.type == 'free') {
    // we have a free variable with arbitrary code in .fn
    // or an ast in .astid (don't need to typecheck)
    if (abstraction.fn) {
      if (abstraction.argCount == 0) return false;
      if (abstraction.args) {
        // abstraction already has args. check if does not match 'next' arg
        var inputType = (input.type == 'free') ? typeof input.fn : input.type;
        if (abstraction.argTypes[abstraction.args.length] != inputType) return false;
      } else if (!('argTypes' in abstraction) || abstraction.argTypes[0] != typeof input) return false;
    }
  }
  return true;
}

// if astid is referenced in the given free identifier,
// retrieve it from the database
const getAstIfNeeded = (entity, cb) => {
  console.log('### G1 ###');
  if (entity.type == 'free' && entity.astid) {
    DataLib.readById(entity.astid, (entity2) => {
      return cb(entity2)
    });
  } else {
    return cb(entity);
  }
}

const apply = (abstraction, input, callback) => {
  console.log('### A1 ###');
  if (!typecheck(abstraction, input)) {
    // can't apply these two. return unchanged AST
    return callback(null, false);
  }
  // create an application of the two entities
  getAstIfNeeded(abstraction, (abstractionPreAst) => {
    getAstIfNeeded(input, (inputPreAst) => {
      console.log('### A2 ###');
      var applicationAst = new AST.Application(abstractionPreAst, inputPreAst);
      return evaluate(applicationAst, (astOut) => {
        console.log('### A3 ###');
        // was able to apply. return changed AST
        return callback(astOut, true);
      });
    });
  });
}

const getXfromValue = (v) => {
  return (v * Math.E) / (1 - v);
}

const getValueFromX = (x) => {
  return x / (x + Math.E);
}

const adjustAssociativeValue = (srcid, dstid, cb) =>  {
  Sql.incrementAssociationRecord(srcid, dstid, function(err, result) {
    if (err) {
      console.log('failed to update assv: ' + srcid + " -> " + dstid);
      return cb(false);
    }

    association.assv = association.assv + 1;
    console.log('incremented associative value ' + srcid + " -> " + dstid);
    return cb(true);
  });
}

// TODO: assv from lastAst -> input
const applyAndAdjustAssociativeValue = (data, input, callback) => {
  console.log('*** AA1 ***');
  apply(data, input, (astOut, success) => {
    if ('association' in data && data.association && data.association.srcid == input.id && data.association.dstid == data.id) {
      // with association, was pulled using association table
      return adjustAssociativeValue(input.id, data.id, (written) => {
        console.log('*** AA2 ***');
        callback(astOut);
      });
    }

    // no association, was pulled straight from Diary, created anew, or has old association
      var association = {
        srcid: input.id, 
        dstid: data.id,
        assv: 1
      }
      Sql.insertAssociationRecord(association, (err, association2) => {
        console.log('*** AA4 ***');
        if (!err) console.log('created associative value ' + input.id + " -> " + data.id + " : " + association2.assv);
        else              console.log('failed to create assv: ' + input.id + " -> " + data.id + " : " + err); // already exists somehow or errored out
        return callback(astOut);
    });
  });
}

// higher level evaluator that combines together all of the 
// expression fragments in the database into a single set of
// possible evaluation points by use of associative value to 
// make selections. also writes associative values upon selection
// (substitution for a lambda combinator)
const combine = (lastAst) => {
  console.log("*** C ***");
  console.log(lastAst);
  if (lastAst != null) console.log("*** C LAST AST *** " + lastAst.data.id);
//  DataLib.readByRandomValue((input) => {
    DataLib.readFreeIdentifierByRandomValue((input) => {

    if (!input) {
      console.log("*** C0.5 *** ");
      return setTimeout(combine, 1, lastAst);
    }
    console.log("********************* C0 ********************* " + input.type + ","+input.id);
    // see if lastAst is usable as an abstraction to apply to the input
    // this selection (lastAst or read-abstraction or input) is probabilistic
    if (Math.random() > 0.5 &&
         lastAst 
        && (lastAst.type == 'abs' || 
           (lastAst.type == 'free' && typeof lastAst.argCount === 'number' && lastAst.argCount > lastAst.args.length))) {
      console.log("*** C1 *** -> " + input.type + " : " + lastAst.type);
      applyAndAdjustAssociativeValue(lastAst, input, (astOut) => {
        setTimeout(combine, 1, astOut);
      });
    } else if (Math.random() > 0.5) {
        //get a pseudo-random free identifier from diary
        DataLib.readFreeIdentifierByRandomValue((freeIdentifier) => {
            if (!freeIdentifier) {
              console.log("*** C1.5 *** ");
              return setTimeout(combine, 1, lastAst);
            }
            console.log("*** C2 *** -> " + input.type + " : " + freeIdentifier.type);
            applyAndAdjustAssociativeValue(freeIdentifier, input, (astOut) => {
              setTimeout(combine, 1, astOut);
            });
        });
    } else {
      // get a pseudo-random abstraction from diary
      DataLib.readApplicatorByAssociativeValue(input.id, (applicator) => {
        if (!applicator) {
          console.log("*** C1.5 *** ");
          return setTimeout(combine, 1, lastAst);
        }
        console.log("*** C2 *** -> " + input.type + " : " + applicator.type);
        applyAndAdjustAssociativeValue(applicator, input, (astOut) => {
          setTimeout(combine, 1, astOut);
        });
      });
    } //else {// TODO: output a random selection
  });
}

// reads the datastore one layer deep
const getAst = (data, cb) => {
  if (data.type == 'abs') {
  console.log('### G2 ###');
console.log(JSON.stringify(data, null, 2));
    DataLib.readById(data.def2, (dataBody) => {
      var ast = new AST.Abstraction(data.name, dataBody);
      ast.data = data;
      cb(ast);
    });
  } else if (data.type == 'app') {
  console.log('### G3 ###');
    DataLib.readById(data.def1, (dataLhs) => {
      DataLib.readById(data.def2, (dataRhs) => {
        var ast = new AST.Application(dataLhs, dataRhs);
        ast.data = data;
        cb(ast);
      });
    });
  } else if (data.type == 'id') {
    var ast = new AST.Identifier(data.indx);
    ast.data = data;
    cb(ast);
  } else if (data.type == 'free') {
    if (data.astid) {
      DataLib.readById(entity.astid, (entity) => {
        getAst(entity, cb); // TODO: catch possible infinite recursion
      });
    } else {
      var identifierAst = new AST.Identifier(
        data.name, data.astid, data.fn, typeof data.fn, data.argCount, data.argTypes);
      identifierAst.data = data;
      cb(identifierAst);
    }
  } else {
    console.log('*** GETAST UNKNOWN TYPE: ' + data.type);
  }
}

// evaluates the (extended) lambda calculus expression given
// and returns the reduced (extended) lambda calculus expression
// executing any complete applications of functional (JS) identifiers
// TODO: make turbo substitutions using EC
const evaluate = (ast, cb) => {
    if ('type' in ast) {
      return getAst(ast, (realAst) => {
        return evaluate(realAst, cb);
      })
    }
    if (isApp(ast)) {
      /**
       * `ast` is an application
       */
      if (isValue(ast.lhs) && isValue(ast.rhs)) {
        console.log("### I 1 ###");
        /**
         * if both sides of the application are values we can proceed and
         * substitute the rhs value for the variables that reference the
         * abstraction's parameter in the evaluation body and then evaluate the
         * abstraction's body
         */
        return substitute(ast.rhs, ast.lhs.body, function(ast2) {
          DataLib.readOrCreateSubstitution("beta", ast.id, ast2.id, (substitution) => {
            return evaluate(ast2, cb);
          });
        });
      } else if (isValue(ast.lhs)) {
        console.log("### I 2 ###");
        /**
         * We should only evaluate rhs once lhs has been reduced to a value
         */
        return ast.rhs = evaluate(ast.rhs, cb);
      } else if (isName(ast.lhs) && ast.lhs.fn && ast.lhs.args.length < ast.lhs.argCount) {
        console.log("### I 3 ###");
        /**
         * lhs is a named function that requires 0 or more args
         */
        // curry in one more arg
        tryExtractArg(ast, (astOut) => {
          return evaluate(astOut, cb);
        });
      } else {
        console.log("### I 4 ###");
        /**
         * Keep reducing lhs until it becomes a value
         */
        ast.lhs = evaluate(ast.lhs, (result) => {
          ast.lhs = result;
          return evaluate(ast.lhs, cb);
        });
      }
    } else if (isValue(ast)) {
      console.log("### II ###");
      /**
       * * `ast` is a value, and therefore an abstraction. That means we're done
        * reducing it, and this is the result of the current evaluation.
        */
      return cb(ast);
    } else if (isName(ast)) {
      /**
       * `ast` is a named identifier / variable, and maybe a named function
       */
      if (ast.fn && ast.args.length == ast.argCount) {
        console.log("### III 1 ###");
        /**
         * lhs is a named function that has 0 or more args
         */
        // has enough args, execute
        if (typeof ast.fn == 'string') {
          ast.fn = eval(ast.fn);  // <= CODE EXECUTION
        }
        var output = ast.fn.apply(null, ast.args);  // <= CODE EXECUTION
        // substitute the named function with its output
        return cb(output);
        // TODO: write substitution to Diary
      } else {
        console.log("### III 2 ###");
        // `ast` is an named identifier / variable and not a named funciton
        return cb(ast);        
      }
    } else {
      console.log('### UNKNOWN TYPE ### ' + typeof ast + ' ' + ast.type);
      return cb(ast);
    }
};

/**
 * when given an ast with lhs a named function which requires at least one more arg,
 * searches rhs for matching expected arg type.
 */
const tryExtractArg = (ast, cb) => {
  // expected arg type is either a JS type or "ast"
  var expectedArgType = ast.lhs.argTypes[ast.lhs.args.length];
  // fn attribute of identifier is js code
  if (ast.rhs.fn && typeof ast.rhs.fn == expectedArgType) {
    console.log("### A ###");
    ast.lhs.args = ast.lhs.args.concat(ast.rhs.fn);
    return cb(ast.lhs);
  } else if (expectedArgType == "ast") {
    console.log("### B ###");
    // if rhs is an identifier with embedded ast expression, use that
    if (isName(ast.rhs) && ast.rhs.astid) {
      ast.lhs.args = ast.lhs.args.concat(ast.rhs.astid);
    } else {
      // rhs is itself an ast expression
      ast.lhs.args = ast.lhs.args.concat(ast.rhs);
    }
    return cb(ast.lhs);
  } else {
    console.log("### C ###");
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
      if (typeof id.value === 'number') {
        var identifierAst = new AST.Identifier(
          id.value + (id.value >= from ? by : 0)
        );
        DataLib.readOrCreateIdentifier(id.value, (identifier) => {
          identifierAst.id = identifier.id;
          return cb2(identifierAst);
        });
      } else {
        DataLib.readOrCreateFreeIdentifier(id.value, (identifier) => {
          var identifierAst = new AST.Identifier(
            identifier.name, identifier.astid, identifier.fn, typeof identifier.fn, identifier.argCount, identifier.argTypes);
          identifierAst.id = identifier.id;
          return cb2(identifierAst);
        });
      }
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
exports.combine = combine;
