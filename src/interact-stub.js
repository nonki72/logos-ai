const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const Grammar = require('./grammar');
const util = require('util');
const { Configuration, OpenAIApi } = require("openai");

var storedSelectFunction;
var keyWordFinderFunction;
var grammarCorrectorFunction;


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


async function setup() {

     // get method code from database (not hard coded here, rely on sensei)
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

    const selectTopicIdentifier = await getFreeIdentifierByName("SelectTopic")
    .catch((reason) => {console.error(reason); return null;});
    if (selectTopicIdentifier == null) {
    return setTimeout(setup, 10000);
    }
    storedSelectFunction = FunctionParser.loadStoredFunction(selectTopicIdentifier);

    const keyWordFinderIdentifier = await getFreeIdentifierByName("KeywordFinder")
    .catch((reason) => {console.error(reason); return null;});
    if (keyWordFinderIdentifier == null) {
    return setTimeout(setup, 10000);
    }
    keyWordFinderFunction = FunctionParser.loadStoredFunction(keyWordFinderIdentifier);

    const GrammarCorrectorIdentifier = await getFreeIdentifierByName("GrammarCorrector")
    .catch((reason) => {console.error(reason); return null;});
    if (GrammarCorrectorIdentifier == null) {
    return setTimeout(setup, 10000);
    }
    grammarCorrectorFunction = FunctionParser.loadStoredFunction(GrammarCorrectorIdentifier);
}
setup();

// get input from user prompt, output highest association
async function interact (inputResult,  outputFunction) {

    // read from input prompt and lookup the matching free identifier by name
    const namedFreeIdentifier = await getFreeIdentifierByInput(inputResult)
        .catch((reason) => {console.error(reason); return null});
    if (namedFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    console.log("namedFreeIdentifier:" + JSON.stringify(namedFreeIdentifier, " ", 4));

    // find a random entry (using custom distribution)
    var namedFreeIdentifierId = namedFreeIdentifier.id;
    if (namedFreeIdentifierId.length != 32) {
        // is a mongo ObjectId
        namedFreeIdentifierId = namedFreeIdentifierId.toString();
    }


    // get a random sentence

    const generatedSentenceTree = await Grammar.generateSentence();
    const generatedSentence = Grammar.treeToString(generatedSentenceTree);
    console.log("generated sentence tree: " + generatedSentenceTree);

    // make the generated sentence eloquent!!
    var sentence = await executeFunctionAsync(grammarCorrectorFunction, [generatedSentence]);
    
    console.log("generated sentence: " + sentence);

    var outputString = sentence;

    // output the random associative entry
    console.log("output:"+outputString);
    return await outputFunction(outputString);


}


// get the input from prompt
async function getFreeIdentifierByInput(inputResult) {
    return new Promise(async (resolve, reject) => {
        // check if a sentence, need to select topic!
        const input = decodeURIComponent(inputResult);
        console.log("Got input: " + input);
        var word = input;
        const inputSplit = input.split(" ");
        if (inputSplit.length > 1) {
            //debugger;
            // use NLP Cloud to find key words




            var keyWordsArray = await executeFunctionAsync(keyWordFinderFunction, [inputResult]);
            // select a key word (topic) at random

            console.log("KEYWORDSARRAY:"+keyWordsArray);
            word = await executeFunctionAsync(storedSelectFunction, [keyWordsArray]);
        }

        // find the matching entry in the database (like a wordnet word)
        await DataLib.readFreeIdentifierByFn('"' + word + '"', async (namedFreeIdentifier) => {
            if (namedFreeIdentifier == null) {
                await DataLib.readByRandomValue('free', (randomFreeIdentifier) => {
                    if (randomFreeIdentifier == null) {
                        return reject(word + " not found, no random found");
                    }
                    return resolve(randomFreeIdentifier);

                });
            } else {
                return resolve(namedFreeIdentifier);
            }
        });
    });
}

// get a free identifier by association 
// might be null if nothing matching the parameters was found
async function getRandomFreeIdentifierByAssociativeValue(namedFreeIdentifierId, fntype, fnmod, fnclas, isFunction) {
    const readByAssociativeValuePromise = new Promise((resolve, reject) => {
        DataLib.readByAssociativeValue(namedFreeIdentifierId, (associatedFreeIdentifier) => {
            if (associatedFreeIdentifier == null) {
                reject('readByAssociativeValue did not return any associated free identifier');
            } else {
                resolve(associatedFreeIdentifier);
            }
        });
    });

    try {
        var randomAssociatedFreeIdentifier = await readByAssociativeValuePromise;
        if (randomAssociatedFreeIdentifier.fntype != fntype || 
                randomAssociatedFreeIdentifier.fnmod != fnmod ||
                randomAssociatedFreeIdentifier.fnmod != fnclas ||
                (randomAssociatedFreeIdentifier.argn != null) != isFunction) {
            randomAssociatedFreeIdentifier = null; // no functions, only words wanted here
        } 
        return randomAssociatedFreeIdentifier;
    } catch (error) {
        console.error(error.message); // "Something went wrong!"
        return null;
    }
}

// get totally random free identifier
async function getRandomFreeIdentifierByRNG(fntype, fnmod, fnclas, isFunction) {
    const readFreeIdentifierByTypeAndRandomValuePromise = new Promise((resolve, reject) => {
        DataLib.readFreeIdentifierByTypeAndRandomValue(fntype, fnmod, fnclas, isFunction, (randomFreeIdentifier) => {
            if (randomFreeIdentifier == null) {
                reject('readfreeIdentifierByTypeAndRandomValue did not return a free identifier');
            } else {
                resolve(randomFreeIdentifier);
            }
        });
    });


    try {
        return await readFreeIdentifierByTypeAndRandomValuePromise;
    } catch (error) {
        console.error(error.message); // "Something went wrong!"
        return null;
    }         
}

module.exports = {
    interact: interact,
    getFreeIdentifierByInput: getFreeIdentifierByInput,
    getRandomFreeIdentifierByAssociativeValue: getRandomFreeIdentifierByAssociativeValue,
    getRandomFreeIdentifierByRNG: getRandomFreeIdentifierByRNG
}