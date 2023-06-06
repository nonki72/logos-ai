const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');

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
        .catch((reason) => {console.error(reason); return null;});
    if (inputFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const storedInputFunction = FunctionParser.loadStoredFunction(inputFreeIdentifier);

    const outputFreeIdentifier = await getFreeIdentifierByName("readlineOutputLine")
        .catch((reason) => {console.error(reason); return null});
    if (outputFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const storedOutputFunction = FunctionParser.loadStoredFunction(outputFreeIdentifier);

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
        return new Promise((resolve, reject) => {
            FunctionParser.executeFunction(storedInputFunction, null, async (inputResult) => {
                // find the matching entry in the database (like a wordnet word)
                await DataLib.readFreeIdentifierByFn('"' + inputResult + '"', (namedFreeIdentifier) => {
                    if (namedFreeIdentifier == null) {
                        return reject(inputResult + " not found");
                    }
                    return resolve(namedFreeIdentifier);
                });
            });
        });
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
            await DataLib.readByAssociativeValue(sourceId, (random) => {
                if (random == null) {
                    return reject(" no random found");
                }
                return resolve(random);
            });
        });
    }

    // find a random entry (using custom distribution)
    // by the free identifier's equivalence class (lookup eq class by astid first)
    async function getRandomByEquivalenceClass(namedFreeIdentifier) {
        return new Promise(async (resolve, reject) => {
            const randomAssociationId = await Sql.getRandomECAstId(namedFreeIdentifier.id);
            if (randomAssociationId == null) {
                return reject(namedFreeIdentifier.fn + " no assv found");
            }
            await DataLib.readById(randomAssociationId, function (randomAssociation) {
                return resolve(randomAssociation);
            });
        });
    }
/*
    // use ec (sql) db to find a random-by-associative-value entry
    const randomAssociation = await getRandomByEquivalenceClass(namedFreeIdentifier)
        .catch((reason) => {console.error(reason); return null});
    if (randomAssociation == null) {
        return setTimeout(interact, 0);
    }
*/
    const random = await getRandom(namedFreeIdentifier.id)
        .catch((reason) => {console.error(reason); return null});
    if (random == null) {
        return setTimeout(interact, 0);
    }

    // output the random associative entry
    console.log("*************ASSOCIA***************");
    //console.log(JSON.stringify(randomAssociation,null,4));
    console.log(JSON.stringify(random));
    await FunctionParser.executeFunction(storedOutputFunction, ["OUTPUT:"+JSON.stringify(random,null,4)], () => {
        return;
    });

    return setTimeout(interact, 0);
}

exports.interact = interact;