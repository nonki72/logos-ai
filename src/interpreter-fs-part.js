
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
  const aux = traverse(from => ({
    Application(app) {
      var applicationAst = new AST.Application(
        aux(app.lhs, from),
        aux(app.rhs, from)
      );
      DataLib.readOrCreateApplication(app.lhs.id, app.rhs.id, (application) => {
        applicationAst.id = application.id;
        return cb(applicationAst);
      });
    },
    Abstraction(abs) {
      aux(abs.body, from + 1, function(node1) {
        var abstractionAst = new AST.Abstraction(
          abs.param,
          node1
        );
        DataLib.readOrCreateAbstraction(abs.id, null, (abstraction) => {
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
        return identifierAst;
      });
    }
  }));
  return cb(aux(node, 0)); // refactor?
};

const subst = (value, node, cb) => {
  const aux = traverse(depth => ({
    Application(app) {
      var applicationAst = new AST.Application(
        aux(app.lhs, depth),
        aux(app.rhs, depth)
      );
      DataLib.readOrCreateApplication(app.lhs.id, app.rhs.id, (application) => {
        applicationAst.id = application.id;
        return cb(applicationAst);
      });
    },
    Abstraction(abs) {
      var abstractionAst = new AST.Abstraction(
        abs.param,
        aux(abs.body, depth + 1)
      );
      DataLib.readOrCreateAbstraction(abs.id, null, (abstraction) => {
        abstractionAst.id = abstraction.id;
        return cb(abstractionAst);
      });
    },
    Identifier(id) {
      if (depth === id.value)
        return shift(depth, value, function(result) {
          cb(result);
        });
      else
        return cb(id);
    }
  }));
  return cb(aux(node, 0)); // refactor?
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