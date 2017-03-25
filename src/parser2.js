const AST = require('./ast');
const Token = require('./token');
const DataLib = require('./datalib');

class Parser {
  constructor(lexer) {
    this.lexer = lexer;
  }

  parse() {
    const result = this.term([]);
    // make sure we consumed all the program, otherwise there was a syntax error
    this.lexer.match(Token.EOF);

    return result;
  }

  // term ::= LAMBDA LCID DOT term
  //        | application
  term(ctx) {
    if (this.lexer.skip(Token.LAMBDA)) {
      const id = this.lexer.token(Token.LCID);
      this.lexer.match(Token.DOT);
      const term = this.term([id].concat(ctx));
      DataLib.readOrCreateIdentifier(id,  (identifier) => {
        DataLib.readOrCreateAbstraction(identifier.id, term.id, (abstraction) => {
          var abstractionAst = new AST.Abstraction(id, term);
          abstractionAst.id = abstraction.id;
          return abstractionAst;  
        });
      });
    }  else {
      return this.application(ctx);
    }
  }

  // application ::= atom application'
  application(ctx) {
    let lhs = this.atom(ctx);

    // application' ::= atom application'
    //                | ε
    while (true) {
      const rhs = this.atom(ctx);
      if (!rhs) {
        if (lhs) {
          DataLib.readOrCreateApplication(lhs.lhs.id, lhs.rhs.id, (application) => {
            lhs.id = application.id; 
            return lhs;
          });
        } else {
          return lhs;
        }
      } else {
        lhs = new AST.Application(lhs, rhs);
      }
    }
  }

  // atom ::= LPAREN term RPAREN
  //        | LCID
  atom(ctx) {
    if (this.lexer.skip(Token.LPAREN)) {
      const term = this.term(ctx);
      this.lexer.match(Token.RPAREN);
      return term;
    } else if (this.lexer.next(Token.LCID)) {
      const id = this.lexer.token(Token.LCID);
      DataLib.readOrCreateIdentifier(id, (identifier) => {
        var identifierAst = new AST.Identifier(ctx.indexOf(id));
        identifierAst.id = identifier.id;
        return identifierAst;
      });
    } else {
      return undefined;
    }
  }
}

module.exports = Parser;
