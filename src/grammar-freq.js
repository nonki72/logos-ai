
const { workerData, parentPort } = require('worker_threads');
const DataLib = require('./datalib');
const tools = require('./tools');

// by random frequency
async function generateBasicPOS(pos) {
    const promise = new Promise(async function (resolve, reject) {
        try {
            const randomMinimumFrequency = Math.random()/100.0;
            const wordByFrequencyObj = await tools.promisify(DataLib.readWordFrequencyAtLeast)(randomMinimumFrequency);
            if (wordByFrequencyObj == null) {
                return reject("No word by frequency found! frequency >= '" + randomMinimumFrequency + "'");
            }
            const wordByFrequency = wordByFrequencyObj.word;
            
            console.log("word by random word frequency: " + wordByFrequency);
        
            // check wordnet for that word
//                const randomPOS = await DataLib.readFreeIdentifierValueByRandomValue('object', 'Grammar', pos);
            DataLib.readFreeIdentifierByFn('"'+wordByFrequency+'"', async (randomPOS) => {
                var word;
                if (randomPOS == null) {
                    console.log("No wordnet entry found! word: '" + wordByFrequency + "', part of speech: '" + pos + "'");
                    word = await generateBasicPOS(pos);
//                        return reject("No wordnet entry found! word: '" + wordByFrequency + "', pos: '" + pos + "'");
                } else if (randomPOS.fnclas !== pos) {
//                    console.log("Wordnet entry is not the right part of speech! word: '" + wordByFrequency + "', part of speech: '" + pos + "'");
                    word = await generateBasicPOS(pos);
                } else {
                    word = randomPOS.fn.replace(/^\"/, '').replace(/\"$/, '');
                }
                return resolve(word);
            });
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