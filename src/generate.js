const DataLib = require('./datalib');
const Sql = require('./sql');
const FunctionParser = require('./functionparser.js');
const F = require('./function');
const Grammar = require('./grammar');
const  {TwitterApi} =  require('twitter-api-v2');
const client = new TwitterApi({
    appKey: 'oLDf5TWtnEfWFuzlaUklW9aUz',
    appSecret: 'cll4R5t5JnwgkH9Xfjfj4EBLwa5Fnmwq5MffCWIILt3V6GQM8i',
    accessToken: '1553263338632744966-CVk4RKEZka18jxVM5bHPaiAUw12Qza',
    accessSecret: 'K1e45cN1pk0RSVQRuGtAC3flQTROpL7gxf5AHzYr4DOZE'
});
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