const AST = require('./ast');
const DataLib = require('./datalib');

const isValue = node => node instanceof AST.Abstraction;
const isName = node => node instanceof AST.Identifier;

const eval = (ast, cb) => {
    if (ast instanceof AST.Application) {
      if (isValue(ast.lhs) && isValue(ast.rhs)) {
        /**
         * if both sides of the application are values we can proceed and
         * substitute the rhs value for the variables that reference the
         * abstraction's parameter in the evaluation body and then evaluate the
         * abstraction's body
         */
        DataLib.createSubstitution("beta", ast.lhs.id, ast.rhs.id, (substitution) => {
          ast = substitute(ast.rhs, ast.lhs.body);
          eval(ast, cb);
        });
      } else if (isValue(ast.lhs)) {
        /**
         * We should only evaluate rhs once lhs has been reduced to a value
         */
        ast.rhs = eval(ast.rhs, cb);
      } else if (isName(ast.lhs) && ast.lhs.body) {
          // a named function that requires n args
          // curry in one more arg
        if (ast.lhs.args.length < ast.lhs.argCount) {
          // expected arg type is either a JS type or "ast"
          var expectedArgType = ast.lhs.argTypes[ast.lhs.args.length];
          if (ast.rhs.fn && typeof ast.rhs.fn == expectedArgType) {
            ast.lhs.args = ast.lhs.args.concat(ast.rhs.fn);
            ast = ast.lhs;
          } else if (expectedArgType == "ast") {
            // if rhs is an identifier with embedded ast expression, use that
            if (isName(ast.rhs) && ast.rhs.ast) {
              ast.lhs.args = ast.lhs.args.concat(ast.rhs.ast);
            } else {
              ast.lhs.args = ast.lhs.args.concat(ast.rhs);
            }
            ast = ast.lhs;
          } else {
            // rhs is not expected arg type
            // evaluate rhs and eventually continue evaluation here
            ast.rhs = eval(ast.rhs, cb);
          }
        }

        if (ast.lhs.args.length == ast.lhs.argCount) {
          // if all args present, run the named function
          // and substitute the expression
          var out = ast.lhs.fn.apply(null, ast.lhs.args);
          ast.lhs = out;
        }
        /* Keep looping until all args are consumed and the function is run
         * or not enough args are found and the lhs remains an identifier 
         * expecting more args while rhs is evaluated
         */
         eval(ast, cb);
      } else {
        /**
         * Keep reducing lhs until it becomes a value
         */
        ast.lhs = eval(ast.lhs, (result) => {
          ast.lhs = result;
          eval(ast, cb);
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

const shift = (by, node) => {
  const aux = traverse(from => ({
    Application(app) {
      return new AST.Application(
        aux(app.lhs, from),
        aux(app.rhs, from)
      );
    },
    Abstraction(abs) {
      return new AST.Abstraction(
        abs.param,
        aux(abs.body, from + 1)
      );
    },
    Identifier(id) {
      return new AST.Identifier(
        id.value + (id.value >= from ? by : 0)
      );
    }
  }));
  return aux(node, 0);
};

const subst = (value, node) => {
  const aux = traverse(depth => ({
    Application(app) {
      return new AST.Application(
        aux(app.lhs, depth),
        aux(app.rhs, depth)
      );
    },
    Abstraction(abs) {
      return new AST.Abstraction(
        abs.param,
        aux(abs.body, depth + 1)
      );
    },
    Identifier(id) {
      if (depth === id.value)
        return shift(depth, value);
      else
        return id;
    }
  }));
  return aux(node, 0);
};

const substitute = (value, node) => {
  return shift(-1, subst(shift(1, value), node));
};

exports.eval = eval;
