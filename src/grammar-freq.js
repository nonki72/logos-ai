
const { workerData, parentPort } = require('worker_threads');
const DataLib = require('./datalib');
const tools = require('./tools');
const Grammar = require('./grammar');

// by random frequency
async function generateBasicPOS(pos) {
    const promise = new Promise(async function (resolve, reject) {
        try {
            const maxFrequencyObj = await tools.promisify(DataLib.readMaxFrequency)();
            const maxFreq = maxFrequencyObj.frequency;
            var randomMinimumFrequency = Math.random()/100.0;
            if (maxFreq < randomMinimumFrequency) {
                randomMinimumFrequency = maxFreq; // make sure it's not too high so as to not get a result
            }
            const wordByFrequencyObj = await tools.promisify(DataLib.readWordFrequencyAtLeast)(randomMinimumFrequency);
            if (wordByFrequencyObj == null) {
                return reject("No word by frequency found! frequency >= '" + randomMinimumFrequency + "'");
            }
            const wordByFrequency = wordByFrequencyObj.word;
            
            console.log("word by random word frequency: " + wordByFrequency);
        

            // check wordnet for wordByFrequency
            const existsInDiary = await Grammar.checkWordnetFor(wordByFrequency, pos);
            if (existsInDiary) {
                return resolve(wordByFrequency);
            }

            // try again
            return resolve(await generateBasicPOS(pos));
        } catch (error) {
            console.error(error);
            return reject(error);
        }
    });
    return promise;
}


try {
    console.log(`Freq thread starting`);
    const pos = workerData.pos;
    generateBasicPOS(pos).then((word) => {
        parentPort.postMessage(word);
    });
} catch (error) {
    console.error(error);
}