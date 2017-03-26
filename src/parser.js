const AST = require('./ast');
const Token = require('./token');
const DataLib = require('./datalib');
console.log("FP");
class Parser {
  constructor(lexer) {
    this.lexer = lexer;
  }

  parse(cb) {
    var self=this;
    this.term([], function(result) {
    // make sure we consumed all the program, otherwise there was a syntax error
          self.lexer.match(Token.EOF);
          return cb(result);
    });

  }

  // term ::= LAMBDA LCID DOT term
  //        | application
  term(ctx,cb) {
    var self=this;
    if (this.lexer.skip(Token.LAMBDA)) {
      const id = this.lexer.token(Token.LCID);
      this.lexer.match(Token.DOT);
      this.term([id].concat(ctx), function(term) {
        DataLib.readOrCreateAbstraction(id, term.id, (abstraction) => {
          var abstractionAst = new AST.Abstraction(id, term);
          abstractionAst.id = abstraction.id;
          return cb(abstractionAst);  
        });
      });
    }  else {
      this.application(ctx, function(app) {
        return cb(app);
      });
    }
  }

  // application ::= atom application'
  application(ctx, cb) {
    var self=this;
    this.atom(ctx, function(lhs) {
      // application' ::= atom application'
      //                | ε
      var atomizer = function() {
        self.atom(ctx, function(rhs) {
          if (!rhs) {
            return cb(lhs);
          } else {
            DataLib.readOrCreateApplication(lhs.id, rhs.id, (application) => {
              lhs = new AST.Application(lhs, rhs);
              lhs.id = application.id;
              atomizer();
            });
          }
        });
      };
      atomizer();

    });

  }

  // atom ::= LPAREN term RPAREN
  //        | LCID
  atom(ctx, cb) {
    var self=this;
    if (self.lexer.skip(Token.LPAREN)) {
      self.term(ctx,function(term){
        self.lexer.match(Token.RPAREN);
        return cb( term);
      });
    } else if (self.lexer.next(Token.LCID)) {
      const id = self.lexer.token(Token.LCID);
      DataLib.readOrCreateIdentifier(id, ctx.indexOf(id), (identifier) => {
        var identifierAst = new AST.Identifier(ctx.indexOf(id));
        identifierAst.id = identifier.id;
        return cb(identifierAst);
      });
    } else {
      return cb(undefined);
    }
  }
}

module.exports = Parser;
