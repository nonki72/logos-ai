const Lexer = require('./src/lexer');
const Parser = require('./src/parser');
const Interpreter = require('./src/interpreter');

const fs = require('fs');
const util = require('util');

let filename;
let printAST = false;
if (process.argv[2] === '--ast') {
  printAST = true;
  filename = process.argv[3];
} else {
  filename = process.argv[2];
}

const source = fs.readFileSync(filename).toString();

const lexer = new Lexer(source);
const parser = new Parser(lexer);
parser.parse(function (ast) {
	if (printAST) {
	  const output = util.inspect(ast, {
	    depth: null,
	    colors: true,
	  });
	  console.log(output);
	} else {
	  Interpreter.evaluate(ast, (result) => {
	  	if (result) {
	  	  console.log(result.toString());
	  	}
	  });
	}

});

