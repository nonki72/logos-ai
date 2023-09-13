const {resolve} = require('path');
const basicFilePath = resolve('../logos-ai/yaml/basic.yaml');
const phrasesFilePath = resolve('../logos-ai/yaml/phrases.yaml');
const wordsFilePath = resolve('../logos-ai/yaml/words.yaml');
const grammarFilePath = resolve('../logos-ai/yaml/grammar.yaml');
const determinersFilePath = resolve('../logos-ai/text/determiners.txt');
const pronounsFilePath = resolve('../logos-ai/text/pronouns.txt');
const prepositionsFilePath = resolve('../logos-ai/text/prepositions.txt');
const complementizersFilePath = resolve('../logos-ai/text/complementizers.txt');
const FunctionParser = require('./functionparser.js');
const DataLib = require('./datalib');
const AST = require('./ast');
const tools = require('./tools');
const sleep = require('sleep-promise');
var Promise = require("bluebird");
const fs = require('fs');
const yaml = require('js-yaml');
const {reject} = require("async/index");
const {basic} = require("needle/lib/auth");
const grammarTree = loadYamlFileTree(grammarFilePath);
const basicDictionary= loadYamlFileTree(basicFilePath);
const phrasesDictionary= loadYamlFileTree(phrasesFilePath);
const wordsDictionary= loadYamlFileTree(wordsFilePath);
const wordsListDictionary = {};

wordsListDictionary['Determiner'] = loadTextFileList(determinersFilePath);
wordsListDictionary['Pronoun'] = loadTextFileList(pronounsFilePath);
wordsListDictionary['Preposition'] = loadTextFileList(prepositionsFilePath);
wordsListDictionary['Complementizer'] = loadTextFileList(complementizersFilePath);

function loadYamlFileTree(filePath) {
    try {
        let fileContents = fs.readFileSync(filePath, 'utf8');
        let data = yaml.load(fileContents);
        return data;
    } catch (e) {
        console.log(e);
        throw 'could not load grammar yaml: ' + e;
    }
}

function loadTextFileList(filePath) {
    const readFileLines = filename =>
        fs.readFileSync(filename)
            .toString('UTF8')
            .split('\n');

    const textFileLines = readFileLines(filePath);
    return textFileLines;
}

// GENERATE FUCTIONS

// look up in the frequency database first
// check the diary (wordnet) for that word
// make sure its the expected type (POS, part of speech)
// if its not recusively call until one is found...
// TODO: MERGE THESE DATABASES FIRST (IN SENSEI) [done]
async function generateBasicPOS(pos, tree, n) {
    const promise = new Promise(async function (resolve, reject) {
        try {
            var wordByMikuOrFrequency = null;

            // by miku neural network
            if (Math.random() > 0.0 && tree != null) {
                console.log("running miku neural network. n: " + n);
                var lastGeneratedWord = null;
                // the tree might not be fully generated yet, so keep checking for n-1th word
                while (lastGeneratedWord == null) {
                    // need fresh leaves array each time we check
                    const leaves = getLeavesInOrderUpToN(tree, n);
                    console.log("miku neural network current leaves for n=" + n + ": " + leaves.toString());
                    lastGeneratedWord = leaves[n - 1];
                    console.log("miku neural network for n=" + n + " last word is currently: " + lastGeneratedWord);
                    if (lastGeneratedWord == null) {
                        await sleep(1000);
                    }
                }
                // load the miku neural network function from Diary
                const wordByMikuFnObj = await tools.promisify(DataLib.readFreeIdentifierByName)("HatsuneMikuNextWordFn");
                if (wordByMikuFnObj == null) {
                    return reject("No free identifier function 'HatsuneMikuNextWordFn' found in Diary");
                }
                const wordByMikuObj = await FunctionParser.promiseExecuteFunction(
                        FunctionParser.loadStoredFunction(wordByMikuFnObj), [lastGeneratedWord]);
                if (wordByMikuObj == null) {
                    return reject("No word by miku neural net found! last generated word: '" + lastGeneratedWord + "'");
                }
                const wordByMiku = wordByMikuObj.word;
                wordByMikuOrFrequency = wordByMiku;
                console.log("word by miku neural net: " + wordByMiku);
            }

            // by random frequency
            if (wordByMikuOrFrequency == null) {
                const randomMinimumFrequency = Math.random()/100.0;
                const wordByFrequencyObj = await tools.promisify(DataLib.readWordFrequencyAtLeast)(randomMinimumFrequency);
                if (wordByFrequencyObj == null) {
                    return reject("No word by frequency found! frequency >= '" + randomMinimumFrequency + "'");
                }
                const wordByFrequency = wordByFrequencyObj.word;
                wordByMikuOrFrequency = wordByFrequency;
                console.log("word by random word frequency: " + wordByFrequency);
            }

//                const randomPOS = await DataLib.readFreeIdentifierValueByRandomValue('object', 'Grammar', pos);
            DataLib.readFreeIdentifierByFn('"'+wordByMikuOrFrequency+'"', async (randomPOS) => {
                var word;
                if (randomPOS == null) {
                    console.log("No wordnet entry found! word: '" + wordByMikuOrFrequency + "', part of speech: '" + pos + "'");
                    word = await generateBasicPOS(pos, lastGeneratedWord);
//                        return reject("No wordnet entry found! word: '" + wordByMikuOrFrequency + "', pos: '" + pos + "'");
                } else if (randomPOS.fnclas !== pos) {
                    console.log("Wordnet entry is not the right part of speech! word: '" + wordByMikuOrFrequency + "', part of speech: '" + pos + "'");
                    word = await generateBasicPOS(pos, lastGeneratedWord);
                } else {
                    word = randomPOS.fn.replace(/^\"/, '').replace(/\"$/, '');
                }
                return resolve(word);
            });
        } catch (error) {
            return reject(error);
        }
    }).catch((error) => {console.error(error)});
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
      } else if (node instanceof String) {
        leaves.push(node);
      } else {
        throw new Error("getLeavesInOrder() ... Unexpected node type: " + node.constructor.name);
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

async function generatePOSTypeTree(POSTypeDefinitionList) {
    const generatedPOSTree = [];
    // iterate through the POS form type definition list for a random type of desired POS
    for (const POSTypeDefinitionAbbreviationIndex in POSTypeDefinitionList) {
        const POSTypeDefinitionAbbreviation = POSTypeDefinitionList[POSTypeDefinitionAbbreviationIndex];
        if (POSTypeDefinitionAbbreviation in basicDictionary) {
            // see basic.yaml
            const basicPOSType = basicDictionary[POSTypeDefinitionAbbreviation];
            try {
//                const lastGeneratedWord = getLastGeneratedWord(generatedPOSTree); // cant do this way because we dont have completed tree
                const generatedPOS = await generateBasicPOS(basicPOSType, generatedPOSTree, POSTypeDefinitionAbbreviationIndex);
                console.log("generated part of speech:"+JSON.stringify(generatedPOS));
                if (generatedPOSTree.length > 0) generatedPOSTree.push(" ");
                generatedPOSTree.push(generatedPOS);
            } catch (error) {
                console.error(error);
                if (generatedPOSTree.length > 0) generatedPOSTree.push(" ");
                generatedPOSTree.push('(' + basicPOSType + ')');
            }
        } else if (POSTypeDefinitionAbbreviation in phrasesDictionary) {
            // see phrases.yaml
            const generatedPOSTreeTemp = await generatePOSTree(POSTypeDefinitionAbbreviation);
            if (generatedPOSTree.length > 0) generatedPOSTree.push(" ");
            generatedPOSTree.push(generatedPOSTreeTemp);
        } else {
            // see words.yaml
            const textPOSType = wordsDictionary[POSTypeDefinitionAbbreviation];
            const textPOSList = wordsListDictionary[textPOSType];
            if (textPOSList == null || textPOSList.length == 0) {
                debugger;
            }
            const randomIndex = getRandomInt(0, textPOSList.length);
            const generatedPOS = textPOSList[randomIndex];
            if (generatedPOSTree.length > 0) generatedPOSTree.push(" ");
            generatedPOSTree.push(generatedPOS);
        }
    }
    return generatedPOSTree;
}

async function generatePOSTree(POSAbbreviation) {
    const POSTypeList = grammarTree[POSAbbreviation];
    const randomIndex = getRandomInt(0,POSTypeList.length - 1);
    const POSTypeDefinitionList = POSTypeList[randomIndex];
    const generatedPOSTree = await generatePOSTypeTree(POSTypeDefinitionList);
    return generatedPOSTree;
}

async function generatePOS(POSAbbreviation) {
    const generatedPOSTree = await generatePOSTree(POSAbbreviation);
    console.log(JSON.stringify(generatedPOSTree));
    if (generatedPOSTree === undefined) {
        console.error("Couldn't generate a: " + POSAbbreviation);
    }
    const generatedPOS = treeToString(generatedPOSTree);
    return generatedPOS;
}

async function generateSentence() {
    const generatedSentence = await generatePOS('S');
    return generatedSentence;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const treeToString = (tree) => {
    if (!tree) return "(?)";
    if (typeof tree == 'string') return tree;
    if (!Array.isArray(tree)) return "(" + typeof tree + ")";
    var string = '';
    for (const element of tree.values()) {
        if (Array.isArray(element)) {
            string = string + treeToString(element);
        } else if ((typeof element === 'string')) {
            string = string + element;
        } else {
            // element is not string or array (ie, tree)
            string = string + "(?)";
        }
    }
    return string;
}



module.exports = {
    loadYamlFileTree: loadYamlFileTree,
    loadTextFileList: loadTextFileList,
    generateBasicPOS: generateBasicPOS,
    generatePOSTypeTree: generatePOSTypeTree,
    generatePOSTree: generatePOSTree,
    generatePOS: generatePOS,
    generateSentence: generateSentence,
    getRandomInt: getRandomInt,
    treeToString: treeToString
}
