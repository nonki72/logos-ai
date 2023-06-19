const Promise = require("bluebird");
const AST = require('./ast');
const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');

var headless = false;

// determines whether the abstraction (function to call) is accepting one more
// parameter, and the input given matches the expected type 
const typecheck = (abstraction, input) => {
  if (AST.isIdentifier(abstraction)) {
    // we have a free variable with arbitrary code in .fn
    // or an ast in .astid (don't need to typecheck)
    if (abstraction.fn) {
      if (abstraction.argCount == 0) return false;
      if (abstraction.args) {
        // abstraction already has args. check if does not match 'next' arg
        var inputType = input.fntype; // may or may not have fntype
        if (abstraction.argTypes[abstraction.args.length] != inputType) return false;
      } else if (!('argTypes' in abstraction) || abstraction.argTypes[0] != typeof input.fn) return false;
    }
  }
  return true;
}

// application of abstraction and an input
const apply = (abstraction, input, callback) => {
  console.log('### APPLY 1 ###');
  if (!typecheck(abstraction, input)) {
    // can't apply these two. return unchanged AST
    console.log('### APPLY UNSUCCESSFUL ###');
    return callback(null, false);
  }
  // create an application of the two entities
  console.log('### APPLY 2 ###');
  DataLib.readOrCreateApplication(abstraction.astid, input.astid, (application) =>{
    var applicationAst = new AST.Application(application.id, abstraction, abstraction.astid, input, input.astid);
    return evaluate(applicationAst, (astOut) => {
      console.log('### APPLY 3 ###');
      // was able to apply. return changed AST
      console.log('### APPLY SUCCESSFUL ###');
      return callback(astOut, true);
    });
  });
}

const adjustAssociativeValue = async (srcid, dstid, cb) =>  {
  var equid = await Sql.incrementECRecord(srcid, dstid);
  if (equid) {
    console.log('incremented associative value ' + srcid + " -> " + dstid);
    return cb(true);
  }

  // no existing association
  var equid1 = await Sql.insertECRecord(srcid);
  var equid2 = await Sql.insertECRecord(dstid, equid1);

  if (equid1 == null || equid2 == null) {
    console.log('failed to insert assv: ' + srcid + " -> " + dstid);
    return cb(false);
  }

  console.log('created associative value ' + srcid + " -> " + dstid);
  return cb(true);
}

// TODO: assv from lastAst -> input
const applyAndAdjustAssociativeValue = async (data, input, callback) => {
  console.log('*** AA1 ***');
  apply(data, input, async (astOut, success) => {
    // if param mismatch, discard input and use only the first part next time
    if (!success) {
      console.log('*** AA2 UNSUCCESSFUL ***');
      return callback(data);
    } 

    // successfully applied abstraction to input, got astOut
    adjustAssociativeValue(data.id, input.id, (written) => {
      console.log('*** AA2 SUCCESSFUL***');
      return callback(astOut);
    });
  });
}


const loadAndExecuteFunction = (ast, fallback, cb) => {

  if (headless && ast.value == "readlineInputLine") {
    console.error("Skipping readlineInputLine...");
    setTimeout(fallback, 1, null);
    return;
  }

  FunctionParser.executeFunction(FunctionParser.loadStoredFunction(ast), ast.args, (output) => {
    // substitute the named function with its output
    if (ast.fntype != 'object') {
      //TODO: typeof should match ast.fntype
      var fixedOutput = (ast.fntype == 'string') ? '"'+output+'"' : output;
      DataLib.readOrCreateFreeIdentifierFunction(output, 
        null, fixedOutput, typeof output, null, null, null, null, null, null, null, (freeIdentifier) => {
        var freeIdentifierAst = AST.cast(freeIdentifier);
        return cb(freeIdentifierAst.fn);
      });
    } else {
      // output is an object, may be AST
      return cb(output); // output is an object as expected
    }
    // TODO: write substitution ast -> output to Diary
  });  // <= CODE EXECUTION
}



// higher level evaluator that combines together all of the 
// expression fragments in the database into a single set of
// possible evaluation points by use of associative value to 
// make selections. also writes associative values upon selection
// (substitution for a lambda combinator)
const combine = async (lastAst) => {
  console.log("*** C ***");
  console.log("lastAst: " + JSON.stringify(lastAst,null,4));
  if (lastAst != null) console.log("*** C LASTAST *** " + lastAst.astid);

  // see if lastAst is usable as an abstraction (function) to apply to the input
  // this selection (lastAst or read-abstraction or input) is probabilistic
  if (//Math.random() > 0.8 &&
       lastAst != null && lastAst.fn != null 
      && (//lastAst.type == 'abs' || 
         (AST.isIdentifier(lastAst) && typeof lastAst.argCount == 'number'))) {
    if (lastAst.argCount > lastAst.args.length) {
      // need more arg
      const nextArgType = lastAst.argTypes[lastAst.args.length];
      console.log("*** C LASTAST:FN/ABS, FREE ***   NEXT ARG "+ 
        nextArgType[0] + ":" + nextArgType[1] + ":" + nextArgType[2]);
      var nextArgFnType = nextArgType[1];
      var nextArgFnMod = nextArgType[2];
      var nextArgFnClas = nextArgType[3];
      DataLib.readFreeIdentifierByTypeAndRandomValue(nextArgFnType, nextArgFnMod, nextArgFnClas, async (input) => {
        if (input == null || input == undefined) {
          setTimeout(combine, 1, null);
          return;
        }

        var inputAst = AST.cast(input);
        if (inputAst == null || inputAst.fn == null) {
          console.error("Unknown AST: " + JSON.stringify(input,null,4));
          setTimeout(combine, 1, lastAst);
          return;
        }

        var output = null;
        // is this a JS function?
        if (inputAst.args != null && inputAst.args >= 0) {
          console.log("*** C1 *** MATCH -> FN : " + inputAst.type + ", " + inputAst.astid);

          // evaluate the string stored at inputAst.fn
          // it is treated as javascript code
          // should be the inputAst.fntype/fnclas 
          output = await Promise.promisify(loadAndExecuteFunction(inputAst, combine));  // <= CODE EXECUTION output or null (could return promise)

        } else {
          // not a JS function
          output = inputAst;
        }

        // output is object or regular type
        if (output.fntype == 'object' && output.fnmod != 'Grammar') lastAst.args.push(output);
        else lastAst.args.push(output.fn);
        adjustAssociativeValue(lastAst.astid, inputAst.astid, (written)=>{
          if (lastAst.args.length == lastAst.argCount) {
            // got enough arg
            evaluate(lastAst, (output) => {
              if (output && Array.isArray(output) && 'id' in output && output.id == lastAst.id) return setTimeout(combine, 1, null); // got stuck in a loop
              if (typeof output == 'object') {
                setTimeout(combine, 1, output);
              } else {
                setTimeout(combine, 1, AST.cast(output));
              }
            });
          } else {
            // still need more arg
            setTimeout(combine, 1, lastAst);
          }
        });

      });
    } else {
      // got enough arg
      console.log("*** C1 *** SELF -> FN " + lastAst.type + ", " + lastAst.astid);
      evaluate(lastAst, (astOut) => {
        setTimeout(combine, 1, astOut);
      });
    }

  // lastAst is not an abstraction or free identifier function that takes args, just an identifier
  // find a suitable function or abstraction to apply to it

  // does not work with a lastAst that is a function! 
  // even if it satisfies the fntype

  //TODO: get by associative value

  //TODO: allow lastAst to be interpreted as a generic Fragment type in readFreeIdentifier() below
  } else if (Math.random() > 0.8 && lastAst && lastAst.args == null) {
    console.log("*** C FN, LASTAST *** " + lastAst.fntype);
    // Get a random function or abstraction to be applied to lastAst (fragment is first part)
    DataLib.readFreeIdentifierFnThatTakesFirstArgOfTypeByRandomValue(lastAst.fntype, lastAst.fnmod, lastAst.fnclas, (fragment) => {
      if (!fragment) {
        console.log("*** C1 NO FRAGMENT *** ");
        return setTimeout(combine, 1, lastAst);
      }

      var fragmentAst = AST.cast(fragment);
      if (fragmentAst == null) {
        console.error("Unknown AST type: " + JSON.stringify(fragment,null,4));
        setTimeout(combine, 1, lastAst);
        return;
      }
      if (fragment.type != 'free') {
        console.error("FN Type not supported yet: "+fragment.type);
        setTimeout(combine, 1, lastAst);
        return;
      }
      console.log("*** C2 WITH FRAGMENT *** " + fragmentAst.type + ","+fragmentAst.astid);
      console.log(JSON.stringify(fragmentAst,null,4));
      console.log(JSON.stringify(lastAst,null,4));

      if (fragmentAst.argTypes[0][1] == 'AST') fragmentAst.args.push(lastAst);
      else fragmentAst.args.push(lastAst.fn);
      adjustAssociativeValue(fragmentAst.astid, lastAst.astid, (written)=>{
        if (fragmentAst.args.length == fragmentAst.argCount) {
          // got enough arg
          evaluate(fragmentAst, (astOut) => {
            setTimeout(combine, 1, astOut);
          });
        } else {
          // still need more arg
          setTimeout(combine, 1, fragmentAst);
        }
      });
    });

  // no lastAst or randomly not using it
  // get a free identifier function that expects args as input
  } else {
      console.log("*** C FN, NULL *** ");
      //get a pseudo-random free identifier function that takes args from diary as replacement for lastAst (first part)
      DataLib.readFreeIdentifierFnByRandomValue(undefined, undefined, (freeIdentifierFn) => {
        if (freeIdentifierFn == null || freeIdentifierFn == undefined) {
          setTimeout(combine, 1, lastAst);
          return;
        }
        // got free identifier function
        var freeIdentifierFnAst = new AST.Identifier(freeIdentifierFn);
        console.log("********************* C1 ********************* " + freeIdentifierFnAst.fntype + ","+freeIdentifierFnAst.astid);
        if (!freeIdentifierFn.fntype || freeIdentifierFn.fn == null || freeIdentifierFn.fn == undefined) {
          setTimeout(combine, 1, lastAst);
          return;
        }
        setTimeout(combine, 1, freeIdentifierFnAst);
      });
/*
  // get a free identifier
  } else {
      console.log("*** C FREE, NULL *** ");
      //get a pseudo-random free identifier function that takes args from diary as replacement for lastAst (first part)
      DataLib.readFreeIdentifierValueByRandomValue(undefined, undefined, (freeIdentifier) => {
        if (freeIdentifier == null) {
          setTimeout(combine, 1, lastAst);
          return;
        }
        // got free identifier
        var freeIdentifierAst = new AST.Identifier(freeIdentifier);
        console.log("********************* C1 ********************* " + freeIdentifierAst.fntype + ","+freeIdentifierAst.astid);
        setTimeout(combine, 1, freeIdentifierAst);
      });
*/
  }
  // TODO: output a random selection
}

// evaluates the (extended) lambda calculus expression given
// and returns the reduced (extended) lambda calculus expression
// executing any complete applications of functional (JS) identifiers
// TODO: make turbo substitutions using EC
const evaluate = async (ast, cb) => {
    if (!AST.isFragment(ast)) {
      return cb(null);
    }
    if (AST.isApplication(ast)) {
      /**
       * `ast` is an application
       */
      if (AST.isAbstraction(ast.lhs) && AST.isAbstraction(ast.rhs)) {
        console.log("### I 1 ###");
        /**
         * if both sides of the application are values we can proceed and
         * substitute the rhs value for the variables that reference the
         * abstraction's parameter in the evaluation body and then evaluate the
         * abstraction's body
         */
        return substitute(ast.rhs, ast.lhs.body, function(ast2) {
          DataLib.readOrCreateSubstitution("beta", ast.astid, ast2.astid, (substitution) => {
            return evaluate(ast2, cb);
          });
        });
      } else if (AST.isAbstraction(ast.lhs)) {
        console.log("### I 2 ###");
        /**
         * We should only evaluate rhs once lhs has been reduced to a value
         */
        return ast.rhs = evaluate(ast.rhs, cb);
      } else if (AST.isIdentifier(ast.lhs) && ast.lhs.fn && ast.lhs.args.length < ast.lhs.argCount) {
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
    } else if (AST.isAbstraction(ast)) {
      console.log("### II ###");
      /**
       * * `ast` is a value, and therefore an abstraction. That means we're done
        * reducing it, and this is the result of the current evaluation.
        */
      return cb(ast);
    } else if (AST.isIdentifier(ast)) {
      /**
       * `ast` is a named identifier / variable, and maybe a named function
       */
      if (ast.argCount !== null && ast.argCount >= 0) {
        if (ast.args.length == ast.argCount) {
          /**
           * lhs is a named function that has 0 or more args
           */
          // has enough args, execute
          if (typeof ast.fn == 'string') {
            console.log("### III 1 A ###");
            return await loadAndExecuteFunction(ast, combine, cb);  // <= CODE EXECUTION output result or null
          } else {
            // fn is not code (a string)
            // it is a virtual function
            // need to look up substitutions for application of ast to its args
            //TODO
            console.log("### III 1 B ###");
            return cb(ast);
          }
        } else {
          // need more args
          console.log("### III 1 C ###");
          return cb(ast);
        }
      } else {
        console.log("### III 2 ###");
        // `ast` is an named identifier / variable and not a named funciton
        return cb(ast);        
      }
    } else {
      console.log('### UNKNOWN TYPE ### ' + typeof ast);
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
    if (AST.isIdentifier(ast.rhs) && ast.rhs.astid) {
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
          DataLib.readOrCreateApplication(node1.astid, node2.astid, (application) =>{
            var applicationAst = new AST.Application(application.id, node1, node1.astid, node2, node2.astid);
            return cb2(applicationAst);
          });
        });
      });
    },
    Abstraction(abs) {
      aux(abs.body, from + 1, function(node1) {
        DataLib.readOrCreateAbstraction(abs.param, body.astid, (abstraction) =>{
          var abstractionAst = new AST.Abstraction(abstraction.id, abs.param, body, body.astid);
          return cb2(abstractionAst);          
        });
      });
    },
    Identifier(id) {
      if (typeof id.value === 'number') {
        DataLib.readOrCreateFreeIdentifier(id.value + (id.value >= from ? by : 0), (identifier) => {
          var identifierAst = new AST.Identifier(identifier);
          return cb2(identifierAst);
        });
      } else {
        DataLib.readOrCreateFreeIdentifier(id.value, (identifier) => {
          var identifierAst = new AST.Identifier(identifier);
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
          DataLib.readOrCreateApplication(node1.astid, node2.astid, (application) =>{
            var applicationAst = new AST.Application(application.id, node1, node1.astid, node2, node2.astid);
            return cb2(applicationAst);
          });
        });
      });
    },
    Abstraction(abs) {
      aux(abs.body, depth + 1, function(node1) {
        DataLib.readOrCreateAbstraction(abs.param, node1.astid, (abstraction) => {
          var abstractionAst = new AST.Abstraction(abstraction.id, abs.param, node1, node1.astid);
          return cb2(abstractionAst);
        });
      });
    },
    Identifier(id) {
      readOrCreateFreeIdentifier(id.value, (identifier) => {
        var identifierAst = new AST.Identifier(identifier);
        if (depth === id.value)
          return shift(depth, value, function(result) {
            cb2(result);
          });
        else
          return cb2(identifierAst);
      });
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
exports.setHeadless = () => {headless = true};