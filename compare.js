const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const Grammar = require('./grammar');

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

async function compareToResponse(input) {
    const getNearestNeighborsFreeIdentifier = await getFreeIdentifierByName("getNearestNeighbors")
      .catch((reason) => {
        console.error(reason);
        process.exit(1);
      });

        // make the DAO object into a function to run
        const getNearestNeighborsFunction = FunctionParser.loadStoredFunction(getNearestNeighborsFreeIdentifier);
        
        FunctionParser.executeFunction(getNearestNeighborsFunction, ['Word'], (tweetResult) => {
            console.log("tweeted. result: \n" + JSON.stringify(tweetResult));
            cb(tweetResult);
        });

        const generatedWord1 = await Grammar.generateBasicPosFreq("Word");
        const generatedWord2 = await Grammar.generateBasicPosFreq("Word");
        




}