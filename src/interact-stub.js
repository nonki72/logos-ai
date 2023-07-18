const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');

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

    // read from input prompt and lookup the matching free identifier by name
    const namedFreeIdentifier = await getFreeIdentifierByInput(inputResult)
        .catch((reason) => {console.error(reason); return null});
    if (namedFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    console.log(namedFreeIdentifier.fn + " id: " + namedFreeIdentifier.id);

    // find a random entry (using custom distribution)
    async function getRandom(sourceId) {
        return new Promise(async (resolve, reject) => {
            await DataLib.readByAssociativeValue(sourceId, (random) => {
                if (random == null) {
                    return reject(" no random found");
                }
                return resolve(random);
            });
        });
    }

    var namedFreeIdentifierId = namedFreeIdentifier.id;
    if (namedFreeIdentifierId.length != 32) {
        // is a mongo ObjectId
        namedFreeIdentifierId = namedFreeIdentifierId.toString();
    }

    var randomAssociation = await getRandom(namedFreeIdentifierId)
        .catch((reason) => {console.error(reason); return null});
    if (randomAssociation == null || randomAssociation.fnmod != 'Grammar') {
        var i = 0;
        while (i < 50 && (randomAssociation == null || randomAssociation.fnmod != 'Grammar')) {
            // nothing found, get a completely random word
            randomAssociation = await getRandom(namedFreeIdentifierId)
              .catch((reason) => {console.error(reason); return null});
            i++;
        }
    }

    console.log("randomassociation:"+JSON.stringify(randomAssociation," ",4));


    if (randomAssociation == null  || randomAssociation.fnmod != 'Grammar') {
        async function getTotallyRandomAssociation () {
            return new Promise((resolve, reject) => {
                try {
                    DataLib.readFreeIdentifierByTypeAndRandomValue('free', 'Grammar', null, (ass) => {
                        return resolve(ass);
                    });
                } catch (e) {
                    return reject(e);
                }
            });
        }
        randomAssociation = await getTotallyRandomAssociation();
        console.log("totallyrandomassociation:"+JSON.stringify(randomAssociation," ",4));
    }

    if (randomAssociation == null) {
        return await outputFunction("Totally failed.");
    }

    var random = JSON.stringify(randomAssociation.fn,null,4);

    // output the random associative entry
    //console.log(JSON.stringify(randomAssociation,null,4));
    await outputFunction(JSON.stringify(random));


}

module.exports = {
    interact: interact
}