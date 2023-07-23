const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const util = require('util');

// get input from user prompt, output highest association
async function interact (inputResult,  outputFunction) {

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
     

    const selectTopicIdentifier = await getFreeIdentifierByName("SelectTopic")
        .catch((reason) => {throw Error(reason)});
    if (selectTopicIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const storedSelectFunction = FunctionParser.loadStoredFunction(selectTopicIdentifier);

    const keyWordFinderIdentifier = await getFreeIdentifierByName("KeyWordFinder")
        .catch((reason) => {throw Error(reason)});
    if (keyWordFinderIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const keyWordFinderFunction = FunctionParser.loadStoredFunction(keyWordFinderIdentifier);

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


    var randomAssociation = null;
    // try to find an entry by PDF (probablity distribution function)
    // what's returned will be in the same Equivalence Class as namedFreeIdentifier and same spec
    // well we are using the Equivalence Class SQL database to look up the ID 
    // ID is called "astid" in EC table, or just "id" in the Diary MongoDB table
    // because of this, we do not know in advance if the probabilistically selected astid matches the spec
    // to ensure that it does, a check is performed in the function here using the Diary MongoDB table
    // TODO: copy specs from Diary to the EC table (they should be considered immutable in the Diary and EC, always in sync)
    // to increase the chances of finding an associated free identifier that matches the spec,
    // the entire function (both SQL and MongoDB queries) is run multiple times until a non-null result is found
    // or until we give up after a maximum number of attempts (10)
    // TODO: make the maximum number of attempts configurable, look up the cardinality of the Equivalence Class for this astid (namedfreeIdentifierId)
    //       (the cardinality of the set of rows where the equid equals the equid of the row with the astid given here: namedfreeIdentifierId)
    // TODO: change combine.js and interpreter.js to associate grammar objects only with their equivalencies not the functions that associate them!
    for (var i = 0; i < 100; i++) {
        randomAssociation = await getRandomFreeIdentifierByAssociativeValue(namedFreeIdentifierId,
            namedFreeIdentifier.fntype, // could be 'object'
            namedFreeIdentifier.fnmod, // could be 'Grammar'
            namedFreeIdentifier.fnmod == 'Grammar' ? null : namedFreeIdentifier.fnclas, // could be null (any POS)
            namedFreeIdentifier.argn != null); // isFunction, could be false [functions take a NUMBER of arguments, denoted by argn]
        if (randomAssociation!= null) {
            break;
        }
    }
    console.log("pseudorandom association:"+JSON.stringify(randomAssociation," ",4));

    // we might have a random association by now
    // if not, find a totally random free identifier that matches the spec of namedFreeIdentifier
    if (randomAssociation == null) {
        // try to find a totally random associative entry (by random number generator)
        // Grammar objects will be searched in the database
        // Grammar objects are not functions
        // DONTDO: randomAssociation = getRandomFreeIdentifierByRNG('object', 'Grammar', null, false); // hardcoded
        randomAssociation = await getRandomFreeIdentifierByRNG(
            namedFreeIdentifier.fntype, 
            namedFreeIdentifier.fnmod, 
            namedFreeIdentifier.fnmod == 'Grammar' ? null : namedFreeIdentifier.fnclas, // could be null (any POS)
            namedFreeIdentifier.argn != null); // isFunction
    }
    console.log("random association:"+JSON.stringify(randomAssociation," ",4));

    var random = JSON.stringify(randomAssociation.fn,null,4);

    // output the random associative entry
    //console.log(JSON.stringify(randomAssociation,null,4));
    return await outputFunction(JSON.stringify(random));


}


// get the input from prompt
async function getFreeIdentifierByInput(inputResult) {
    return new Promise(async (resolve, reject) => {
        // check if a sentence, need to select topic!

        console.log("Got input: " + inputResult);
        const inputSplit = inputResult.split(" ");
        var word = inputResult;
        if (inputSplit.length > 1) {
            debugger;
            // use NLP Cloud to find key words




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