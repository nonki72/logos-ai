const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const Grammar = require('./grammar');
const  {TwitterApi} =  require('twitter-api-v2');
const twitterConfig = require('../keys/twitter.json');
const client = new TwitterApi(twitterConfig);
const rwClient = client.readWrite

async function generateTweet() {
    const generatedSentence = await Grammar.generateSentence();

    try {
        await rwClient.v2.tweet(generatedSentence);
    } catch (e) {
        console.error(e);
    }

    console.log("generated tweet: '" + generatedSentence + "'");
}

exports.generateTweet = generateTweet;