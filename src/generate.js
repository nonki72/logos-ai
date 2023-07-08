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
   const storedTweetFunction = FunctionParser.loadStoredFunction(tweetFreeIdentifier);

    const generatedSentenceTree = await Grammar.generateSentence();
    const generatedSentence = Grammar.treeToString(generatedSentenceTree);
    console.log("generated tweet: " + generatedSentenceTree);


    const ok = await yesno({
        question: 'Would you like to tweet this?'
    });

    if (ok) {
        var tweetResult = await FunctionParser.executeFunction(storedTweetFunction, [generatedSentence]);
        console.log("tweeted: '" + generatedSentence + "'");
    }

}

exports.generateTweet = generateTweet;
