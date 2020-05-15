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
  console.log('### APPLY 1 ###');
  if (!typecheck(abstraction, input)) {
    // can't apply these two. return unchanged AST
    console.log('### APPLY UNSUCCESSFUL ###');
    return callback(null, false);
  }
  // create an application of the two entities
  getAstIfNeeded(abstraction, (abstractionPreAst) => {
    getAstIfNeeded(input, (inputPreAst) => {
      console.log('### APPLY 2 ###');
      var applicationAst = new AST.Application(abstractionPreAst, inputPreAst);
      return evaluate(applicationAst, (astOut) => {
        console.log('### APPLY 3 ###');
        // was able to apply. return changed AST
        console.log('### APPLY SUCCESSFUL ###');
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

const adjustAssociativeValue = async (srcid, dstid, cb) =>  {
  var res = await Sql.incrementAssociationRecord(srcid, dstid);
  if (!res) {
    var association = {
      srcid: srcid,
      dstid: dstid,
      assv: 1
    };
    var res2 = await Sql.insertAssociationRecord(association);
    if (!res2) {
      console.log('failed to update assv: ' + srcid + " -> " + dstid + " : " + err2);
      return cb(false);
    }
    return cb(true);
  }

  console.log('incremented associative value ' + srcid + " -> " + dstid);
  return cb(true);
}

// TODO: assv from lastAst -> input
const applyAndAdjustAssociativeValue = async (data, input, callback) => {
  console.log('*** AA1 ***');
  apply(data, input, async (astOut, success) => {
    if (!success) return callback(data); // if param mismatch, discard input and use only the first part next time
    var association = await Sql.getAssociationRecord(input.id, data.id);
    if (association != null) {
      adjustAssociativeValue(input.id, data.id, (written) => {
        console.log('*** AA2 ***');
        return callback(astOut);
      });
    } else {

      // no association, was pulled straight from Diary, created anew, or has old association
        var association = {
          srcid: input.id, 
          dstid: data.id,
          assv: 1
        }
        var res = await Sql.insertAssociationRecord(association);
        console.log('*** AA4 ***');
        if (res) console.log('created associative value ' + input.id + " -> " + data.id + " : " + association.assv);
        else              console.log('failed to create assv: ' + input.id + " -> " + data.id + " : " + err); // already exists somehow or errored out
        return callback(astOut);
    }
  });
}

// higher level evaluator that combines together all of the 
// expression fragments in the database into a single set of
// possible evaluation points by use of associative value to 
// make selections. also writes associative values upon selection
// (substitution for a lambda combinator)
const combine = async (lastAst) => {
  console.log("*** C ***");
  console.log("lastAst: " + JSON.stringify(lastAst,null,4));
  if (lastAst != null) console.log("*** C LASTAST *** " + lastAst.id);

  // see if lastAst is usable as an abstraction to apply to the input
  // this selection (lastAst or read-abstraction or input) is probabilistic
  if (//Math.random() > 0.5 &&
       lastAst 
      && (//lastAst.type == 'abs' || 
         (lastAst.type == 'free' && typeof lastAst.argn === 'number'))) {
    if (!('args' in lastAst)) {
      lastAst.args = [];
      lastAst.argCount = 0;
    }
    if (lastAst.argn > lastAst.args.length) {
      // need more arg
      console.log("*** C LASTAST, FREE *** TYPE "+ lastAst.argt[0][0]);
      DataLib.readFreeIdentifierByTypeAndRandomValue(lastAst.argt[lastAst.argCount][1], (input) => {
        console.log("********************* C0 ********************* " + input.type + ","+input.id);
        console.log("*** C1 *** MATCH -> " + lastAst.type + " : " + input.type);

        lastAst.args.push(input);
        lastAst.argCount++;
        adjustAssociativeValue(lastAst.id, input.id, (written)=>{
          if (lastAst.args.length == lastAst.argn) {
            // got enough arg
            evaluate(lastAst, (astOut) => {
              setTimeout(combine, 1, astOut);
            });
          } else {
            // still need more arg
            setTimeout(combine, 1, lastAst);
          }
        });

      });
    } else {
      // got enough arg
      evaluate(lastAst, (astOut) => {
        setTimeout(combine, 1, astOut);
      });
    }

  // no lastAst or randomly not using it
  } else {//if (Math.random() > 0.5) {
      console.log("*** C FN_TAKE_ARGS, NULL *** ");
      //get a pseudo-random free identifier function that takes args from diary as replacement for lastAst (first part)
      DataLib.readRandomFreeIdentifierFnThatTakesArgs((freeIdentifierFn) => {
          console.log("********************* C1 ********************* " + freeIdentifierFn.type + ","+freeIdentifierFn.id);
          setTimeout(combine, 1, freeIdentifierFn);
      });
  } //else {
/*    console.log("*** C FREE, ASSOCIATIVE *** ");
    // Get a random free identifier as fresh input to be applied to lastAst (input is second part)
    DataLib.readFreeIdentifierByRandomValue((freeIdentifier) => {
      console.log("freeIdentifier: " + JSON.stringify(freeIdentifier,null,4));
      if (!freeIdentifier) {
        console.log("*** C1 *** ");
        return setTimeout(combine, 1, lastAst);
      }
      console.log("********************* C2 ********************* " + freeIdentifier.type + ","+freeIdentifier.id);
      // get a pseudo-random abstraction from diary as replacement for lastAst (first part)
      DataLib.readByAssociativeValue(freeIdentifier.id, (fragment) => {
        if (!fragment) {
          console.log("*** C2 *** ");
          return setTimeout(combine, 1, lastAst);
        }

        console.log("********************* C3 ********************* " + fragment.type + ","+fragment.id);
        console.log("*** C3 *** -> " + freeIdentifier.type + " : " + fragment.type);
        applyAndAdjustAssociativeValue(freeIdentifier, fragment, (astOut) => {
          setTimeout(combine, 1, astOut);
        });
      });
    });
  } //else {// TODO: output a random selection
*/
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
const evaluate = async (ast, cb) => {
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
          console.log("!!!!!!!!!!!!!!CODE EXECUTION!!!!!!!!!!!\n"+ast.fn+"\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
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
