const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');

const interact = () => {
      // get input from user prompt, output highest association
        DataLib.readFreeIdentifierByName("readlineInputLine", (inputFreeIdentifier) => {
            DataLib.readFreeIdentifierByName("readlineOutputLine", (outputFreeIdentifier) => {

                var storedInputFunction = FunctionParser.loadStoredFunction(inputFreeIdentifier);
                var storedOutputFunction = FunctionParser.loadStoredFunction(outputFreeIdentifier);

                FunctionParser.parseFunction(storedInputFunction, null, (errIn) => {
                    FunctionParser.parseFunction(storedOutputFunction, ["TESTING OUTPUT"], (errOut) => {
                        if (errIn != null || errOut != null) {
                            console.log(errIn + ", " + errOut);
                            return setTimeout(interact, 1);
                        }
                        FunctionParser.executeFunction(storedInputFunction, null, (inputResultPromise) => {
        
                            inputResultPromise.then((inputResult) => {

                                DataLib.readFreeIdentifierByFn('"' + inputResult + '"', async (namedFreeIdentifier) => {
                                    if (namedFreeIdentifier == null) {
                                        console.log("*** C3 *** -> " + inputResult + " not found");
                                        return setTimeout(interact, 1);
                                    }
                                    console.log(inputResult + " id: " + namedFreeIdentifier.id);
                                    var randomAssociationId = await Sql.getRandomECAstId(namedFreeIdentifier.id);
                                    if (randomAssociationId == null) {
                                        console.log("*** C3 *** -> " + inputResult + " no assv found");
                                        return setTimeout(interact, 1);
                                    }
                                    DataLib.readById(randomAssociationId, function(randomAssociation) {
                                        console.log("****************************");
                                        console.log(JSON.stringify(randomAssociation,null,4));
                                        FunctionParser.executeFunction(storedOutputFunction, "OUTPUT:"+randomAssociation, () => {
                                            return setTimeout(interact, 1);
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
};

exports.interact = interact;
