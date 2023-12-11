const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const util = require('util');


// get readline code from database (not hard coded i/o here, rely on sensei)
async function getFreeIdentifierByName (name) {
    return new Promise((resolve, reject) => {
        DataLib.readFreeIdentifierByName(name, (freeIdentifier) => {
            if (freeIdentifier == null) {
                return reject("couldn't retrieve "+name+" from database");
            }
            return resolve(freeIdentifier);
        });
    });
}

// run a function from the database as a promise
async function executeFunctionAsync (fn, args) {
    return new Promise((resolve, reject) => {
        try {
            FunctionParser.executeFunction(fn, args, (result) => {
                return resolve(result);
            });
        } catch (e) {
            return reject(e);
        }
    });
}


// get input from user prompt, output spacy document
async function talk () {

    const inputFreeIdentifier = await getFreeIdentifierByName("readlineInputLine")
        .catch((reason) => {throw Error(reason)});
    if (inputFreeIdentifier == null) {
        return setTimeout(talk, 0);
    }
    const storedInputFunction = FunctionParser.loadStoredFunction(inputFreeIdentifier);

    const outputFreeIdentifier = await getFreeIdentifierByName("readlineOutputLine")
        .catch((reason) => {throw Error(reason)});
    if (outputFreeIdentifier == null) {
        return setTimeout(talk, 0);
    }
    const storedOutputFunction = FunctionParser.loadStoredFunction(outputFreeIdentifier);

    const getNlpDocIdentifier = await getFreeIdentifierByName("getNlpDoc")
        .catch((reason) => {throw Error(reason)});
    if (getNlpDocIdentifier == null) {
        return setTimeout(talk, 0);
    }
    const getNlpDocFunction = FunctionParser.loadStoredFunction(getNlpDocIdentifier);


    const input = await executeFunctionAsync(storedInputFunction, null);
    const nlpDocument = await executeFunctionAsync(getNlpDocFunction, [input]);
    await executeFunctionAsync(storedOutputFunction, [util.inspect(nlpDocument)]);


//    return setTimeout(talk, 0);
}

exports.talk = talk;