const DataLib = require('./datalib');
const Sql = require('./sql');
const InteractStub = require('./interact-stub.js');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
var ObjectID = require("mongodb").ObjectID;

// get input from user prompt, output highest association
async function interact () {

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
    
     // use above code to read from database and convert to DAO objects
    const inputFreeIdentifier = await getFreeIdentifierByName("readlineInputLine")
        .catch((reason) => {throw Error(reason)});
    if (inputFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const storedInputFunction = FunctionParser.loadStoredFunction(inputFreeIdentifier);

    const outputFreeIdentifier = await getFreeIdentifierByName("readlineOutputLine")
        .catch((reason) => {throw Error(reason)});
    if (outputFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const storedOutputFunction = FunctionParser.loadStoredFunction(outputFreeIdentifier);



    const selectTopicIdentifier = await getFreeIdentifierByName("SelectTopic")
        .catch((reason) => {throw Error(reason)});
    if (selectTopicIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const storedSelectFunction = FunctionParser.loadStoredFunction(selectTopicIdentifier);

    const keywordFinderIdentifier = await getFreeIdentifierByName("KeywordFinder")
        .catch((reason) => {throw Error(reason)});
    if (keywordFinderIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const keyWordFinderFunction = FunctionParser.loadStoredFunction(keywordFinderIdentifier);

    
    // vv not required below
/*
    // fail-safe check the loaded function DAOs
    async function parseIoFunctions () {
        return new Promise((resolve, reject) => {
            FunctionParser.parseFunction(storedInputFunction, null, (errIn) => {
                if (errIn != null) {
                    return reject(errIn);
                }
                FunctionParser.parseFunction(storedOutputFunction, ["TESTING OUTPUT"], (errOut) => {
                    if (errOut != null) {
                        return reject(errOut);
                    }
                    resolve();
                });
            });
        });
    }

    await parseIoFunctions();
*/
    // ^^ not required above


    // get the input from prompt
    async function getFreeIdentifierByInput() {
        return new Promise(async (resolve, reject) => {
//            FunctionParser.executeFunction(storedInputFunction, null, async (inputResult) => {
var inputResult = "word";
            // check if a sentence, need to select topic!

                inputSplit = inputResult.split(" ");
                var word = inputResult;
                if (inputSplit.length > 1) {
                    // use NLP to find key words




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
        //});
    }

    // read from input prompt and lookup the matching free identifier by name
    const namedFreeIdentifier = await getFreeIdentifierByInput()
        .catch((reason) => {console.error(reason); return null});
    if (namedFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    console.log(namedFreeIdentifier.fn + " id: " + namedFreeIdentifier.id);

    // find a random entry (using custom distribution)
    async function getRandom(sourceId) {
        return new Promise(async (resolve, reject) => {
            try {
                await DataLib.readByAssociativeValue(sourceId, (random) => {
                    if (random == null) {
                        return reject("no random found");
                    }
                    return resolve(random);
                });
            } catch (e) {
                return reject(e);
            }
        });
    }

    // select a random entry from the database (try using distribution, then RNG)
    var randomAssociation = null;

    if (ObjectID.isValid(namedFreeIdentifier.id)) {
        // use custom distribution
        randomAssociation = await getRandom(namedFreeIdentifier.id)
            .catch((reason) => {console.error(reason); return null});
        if (randomAssociation == null) {
            randomAssociation = await getRandom(namedFreeIdentifier.id)
                .catch((reason) => {console.error(reason); return null});
        }
    }

    // get what the association is referring to
    async function getSubstitutionByDef1 (id) {
        return new Promise((resolve, reject) => {
            DataLib.readSubstitutionByDef1(id, (identifier) => {
                if (identifier == null) {
                    return reject("couldn't retrieve substitution for def1 "+id+" from database");
                }
                return resolve(identifier);
            });
        });
    }
    async function getIdentifierById (id) {
        return new Promise((resolve, reject) => {
            DataLib.readById(id, (identifier) => {
                if (identifier == null) {
                    return reject("couldn't retrieve "+id+" from database");
                }
                return resolve(identifier);
            });
        });
    }

    console.log("random association:"+JSON.stringify(randomAssociation," ",4));
    // might have a random association
    // resolve the substitution to obtain a free identifier (entry)
    var randomEntry = null;
    if (randomAssociation != null) {
        try {


            randomSubstitution = await getSubstitutionByDef1(randomAssociation.id);
            if (randomSubstitution != null) {
                console.log("random substitution:"+JSON.stringify(randomSubstitution," ",4));
                const randomSynonym = await getIdentifierById(randomSubstitution.def2);


                randomEntry2 = await getIdentifierById(randomSubstitution.def2)
                console.log("random entry:"+JSON.stringify(randomEntry2," ",4));
            
            }
        } catch(err) {
            console.error(err);
            // continue
        }
    }

    // if not found, get something more random with RNG
    if (randomEntry == null || randomEntry.fnmod!= 'Grammar') {
        randomEntry = await InteractStub.getRandomFreeIdentifierByRNG("object", 'Grammar', namedFreeIdentifier.fnclas, false);
    }

    console.log("random entry:"+JSON.stringify(randomEntry," ",4));


    if (randomEntry == null  || randomEntry.fnmod != 'Grammar') {
        console.error("Couldn't find any word!");
        return setTimeout(interact, 0);
    }

    var random = JSON.stringify(randomEntry.fn,null,4);

    // output the random associative entry
    console.log("*************ASSOCIA***************");
    //console.log(JSON.stringify(randomEntry,null,4));
    console.log(JSON.stringify(random));
    // await FunctionParser.executeFunction(storedOutputFunction, ["OUTPUT:"+random], () => {
    //     return;
    // });


    //return setTimeout(interact, 0);
}

exports.interact = interact;