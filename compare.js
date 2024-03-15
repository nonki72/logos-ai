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

async function compareToResponse() {
    const getSimilarityFreeIdentifier = await getFreeIdentifierByName("getSimilarity")
        .catch((reason) => {
            console.error(reason);
            process.exit(1);
        });

    const generatedWord1 = await Grammar.generateBasicPosFreq("Word");
    const generatedWord2 = await Grammar.generateBasicPosFreq("Word");

    // make the DAO object into a function to run
    const getSimilarityFunction = FunctionParser.loadStoredFunction(getSimilarityFreeIdentifier);

    FunctionParser.executeFunction(getSimilarityFunction, [generatedWord1, generatedWord2], (similarityResult) => {
        console.log("similarity result: \n" + JSON.stringify(similarityResult));
        cb(similarityResult);
    });
}

compareToResponse();