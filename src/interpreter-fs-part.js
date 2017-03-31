
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
      DataLib.readOrCreateApplication(app.lhs.id, app.rhs.id, (application) => {
        var applicationAst = new AST.Application(
          aux(app.lhs, from),
          aux(app.rhs, from)
        );
        applicationAst.id = application.id;
        return cb(applicationAst);
      });
    },
    Abstraction(abs) {
      DataLib.readOrCreateAbstraction(abs.id, null, (abstraction) => {
        var abstractionAst = new AST.Abstraction(
          abs.param,
          aux(abs.body, from + 1)
        );
        abstractionAst.id = abstraction.id;
        return cb(abstractionAst);
      });
    },
    Identifier(id) {
      DataLib.createFreeIdentifier(id.value, null, null, null, null, (identifier) => {
        var identifierAst = new AST.Identifier(
          id.value + (id.value >= from ? by : 0)
        );
        identifierAst.id = identifier.id;
        return cb(identifierAst);
      });
    }
  }));
  return cb(aux(node, 0)); // refactor?
};

const subst = (value, node, cb) => {
  const aux = traverse(depth => ({
    Application(app) {
      DataLib.readOrCreateApplication(app.lhs.id, app.rhs.id, (application) => {
        var applicationAst = new AST.Application(
          aux(app.lhs, depth),
          aux(app.rhs, depth)
        );
        applicationAst.id = application.id;
        return cb(applicationAst);
      });
    },
    Abstraction(abs) {
      DataLib.readOrCreateAbstraction(abs.id, null, (abstraction) => {
        var abstractionAst = new AST.Abstraction(
          abs.param,
          aux(abs.body, depth + 1)
        );
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