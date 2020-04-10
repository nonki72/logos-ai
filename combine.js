const Lexer = require('./src/lexer');
const Parser = require('./src/parser');
const Interpreter = require('./src/interpreter');

const fs = require('fs');
const util = require('util');

let printAST = false;
if (process.argv[2] === '--ast') {
  printAST = true;
}

Interpreter.combine();


