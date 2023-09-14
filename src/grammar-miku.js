
const { workerData, parentPort } = require('worker_threads');
const FunctionParser = require('./functionparser.js');
const DataLib = require('./datalib');
const tools = require('./tools');

// by miku neural network
async function generateBasicPOS(tree, n) {
    const promise = new Promise(async function (resolve, reject) {
        try {
            if (n > 0 && Math.random() < 0.5) {
                console.log("running miku neural network. n: " + n);
                var lastGeneratedWord = null;
                // the tree might not be fully generated yet, so keep checking for n-1th word
                var intervalId = setInterval(async function() {
                    if (lastGeneratedWord == null) {
                        // need fresh leaves array each time we check
                        const leaves = getLeavesInOrderUpToN(tree, n);
                        console.log("miku neural network current leaves for n=" + n + ": " + leaves.toString());
                        lastGeneratedWord = leaves[n - 2];
                        console.log("miku neural network for n=" + n + " last word is currently: " + lastGeneratedWord);

                        console.log("tree: " + JSON.stringify(tree));
                    } else {
                        clearInterval(intervalId);
                        // load the miku neural network function from Diary
                        const wordByMikuFnObj = await tools.promisify(DataLib.readFreeIdentifierByName)("HatsuneMikuNextWordFn");
                        if (wordByMikuFnObj == null) {
                            return reject("No free identifier function 'HatsuneMikuNextWordFn' found in Diary");
                        }
                        const wordByMiku = await FunctionParser.promiseExecuteFunction(
                                FunctionParser.loadStoredFunction(wordByMikuFnObj), [lastGeneratedWord]);
                        if (wordByMiku == null) {
                            return reject("No word by miku neural net found! last generated word: '" + lastGeneratedWord + "'");
                        }
                        console.log("word by miku neural net: " + wordByMiku);

                        return resolve(wordByMiku);
                    }
                }, 1000);                          
                
            }

        } catch (error) {
            console.error(error);
            return reject(error);
        }
    });

    return promise;
}        


function getLeavesInOrderUpToN(tree, n) {
    if (!tree) {
      return [];
    }
  
    const leaves = [];
  
    const traverse = (node) => {
      if (leaves.length >= n) {
        return;
      }
      if (node == null) {
        leaves.push(null);

      } else if (Array.isArray(node)) {
        node.forEach(child => {
            traverse(child);
        });
      } else if (typeof node == "string") {
        leaves.push(node);
      } else {
        throw new Error("getLeavesInOrder() ... Unexpected node type: " + typeof node);
      }
    };
  
    traverse(tree);
  
    return leaves;
  }
  
  

// function getLastGeneratedWord(generatedPOSTree) {
//     var gpostLength = generatedPOSTree.length;
//     // when ends in " ", chop it off
//     if (generatedPOSTree[gpostLength] == " ") {
//         // recur
//         const generatedPOSTreeShortened = generatedPOSTree.slice(0, gpostLength - 2);
//         return getLastGeneratedWord(generatedPOSTreeShortened);
//     }

//     // formatted, now get last word
//     const lastGeneratedThing = generatedPOSTree[gpostLength - 1];

//     // if last position holds a sub array, recur on that sub array
//     if (Array.isArray(lastGeneratedThing)) {
//         // recur on last thing (array)
//         return getLastGeneratedWord(lastGeneratedThing)
//     }

//     // if string, return it
//     if (lastGeneratedThing instanceof String) {
//         // return last thing (word)
//         return lastGeneratedThing;
//     }

//     // else we got some other type (not allowed)
//     return null;
    
// }


try {
    console.log(`Miku thread starting`);
    const tree = workerData.tree;
    const n = workerData.n;
    generateBasicPOS(tree, n).then((word) => {
        parentPort.postMessage(word);
    });
} catch (error) {
    console.error(error);
}