const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const Grammar = require('./grammar');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

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


async function chat() {


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

    // use above code to read from database and convert to DAO objects
    const tweetFreeIdentifier = await getFreeIdentifierByName("twitterTweet")
        .catch((reason) => {console.error(reason); return null;});
    if (tweetFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }

    const generatedSentenceTree = await Grammar.generateSentence();
    const generatedSentence = Grammar.treeToString(generatedSentenceTree);
    console.log("generated reply tree: " + generatedSentenceTree);
    console.log("generated reply: " + generatedSentence);

    await sleep(5000);
}

exports.generateTweet = generateTweet;