const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const Grammar = require('./grammar');
const  {TwitterApi} =  require('twitter-api-v2');
const twitterConfig = require('../keys/twitter.json');
const client = new TwitterApi(twitterConfig);
const rwClient = client.readWrite
const yesno = require('yesno'); 
const { Configuration, OpenAIApi } = require("openai");
const openaiConfig = require("../keys/openai.json");

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function generateTweet() {

    // get tweet code from database (not hard coded i/o here, rely on sensei)
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
    const tweetFreeIdentifier = await getFreeIdentifierByName("twitterTweet")
            .catch((reason) => {console.error(reason); return null;});
    if (tweetFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    // make the DAO object into a function to run
    const storedTweetFunction = FunctionParser.loadStoredFunction(tweetFreeIdentifier);

    // generate a sentence skeleton!
    const generatedSentenceTree = await Grammar.generateSentence();
    const generatedSentence = Grammar.treeToString(generatedSentenceTree);
    console.log("generated sentence tree: " + generatedSentenceTree);

    // load GC function, as above
    const grammarCorrectorFreeIdentifier = await getFreeIdentifierByName("GrammarCorrector")
    .catch((reason) => {console.error(reason); return null;});
    if (grammarCorrectorFreeIdentifier == null) {
        return setTimeout(interact, 0);
    }
    const storedGrammarCorrectorFunction = FunctionParser.loadStoredFunction(grammarCorrectorFreeIdentifier)

    // run GC on the generated spooky sentence skelly
    FunctionParser.executeFunction(storedGrammarCorrectorFunction, [generatedSentence], async (tweetSentence) => {
        // tweet the result (or not)
        console.log("generated sentence: " + tweetSentence);
        const ok = await yesno({
            question: 'Would you like to tweet this?'
        });

        if (ok) {
        FunctionParser.executeFunction(storedTweetFunction, [tweet], async (tweetResult) => {
                console.log("tweeted. result: \n" + tweetResult);
            });
        }
    });
    
    await sleep(5000);
}

exports.generateTweet = generateTweet;
