const Lexer = require('./src/lexer');
const Parser = require('./src/parser');
const axios = require('axios').default;

const fs = require('fs');
const util = require('util');

const axi = axios.create({
	baseURL: 'http://localhost:8080/api/',
	timeout: 1000
  });

let filename;
let printAST = false;
if (process.argv[2] === '--ast') {
  printAST = true;
  filename = process.argv[3];
} else {
  filename = process.argv[2];
}

const source = fs.readFileSync(filename).toString();

axi.post('/lambda/evaluate', {
	expression: source
	})
	.then(function (response) {
	console.log(response.data.result);
	})
	.catch(function (error) {
	console.log(error);
	});