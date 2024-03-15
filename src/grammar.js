const DataLib = require('./datalib');
const {resolve} = require('path');
const basicFilePath = resolve('../logos-ai/yaml/basic.yaml');
const phrasesFilePath = resolve('../logos-ai/yaml/phrases.yaml');
const wordsFilePath = resolve('../logos-ai/yaml/words.yaml');
const grammarFilePath = resolve('../logos-ai/yaml/grammar.yaml');
const determinersFilePath = resolve('../logos-ai/text/determiners.txt');
const pronounsFilePath = resolve('../logos-ai/text/pronouns.txt');
const prepositionsFilePath = resolve('../logos-ai/text/prepositions.txt');
const complementizersFilePath = resolve('../logos-ai/text/complementizers.txt');
const {Worker} = require('worker_threads');
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

async function generateBasicPosMiku(tree, n) {
    const promise = new Promise(async function (resolve, reject) {
        if (n <= 1) return resolve(null);
        const workerMiku = new Worker('./src/grammar-miku', { workerData: {"tree":tree, "n":n} });  
        workerMiku.on('error', (err) => { console.error(err); return resolve(null); });
        workerMiku.on('exit', () => {
        console.log(`Miku thread exiting`);
        })
        workerMiku.on('message', (word) => {
            console.log("got miku message, word: " + word);
            workerMiku.terminate();
            return resolve(word);
        });
    }).catch((error) => {console.error(error)});
    return promise;
}
async function generateBasicPosFreq(pos) {
    const promise = new Promise(async function (resolve, reject) {
        const workerFreq = new Worker('./src/grammar-freq', { workerData: {"pos": pos} });
        workerFreq.on('error', (err) => { console.error(err); return resolve(null); });
        workerFreq.on('exit', () => {
        console.log(`Freq thread exiting`);
        })
        workerFreq.on('message', (word) => {
            console.log("got freq message, word: " + word);
            workerFreq.terminate();
            return resolve(word);
        });
    }).catch((error) => {console.error(error)});
    return promise;
}
// check wordnet for a word
async function checkWordnetFor(word, pos) {
    const promise = new Promise(async function (resolve, reject) {
        DataLib.readFreeIdentifierByFn('"'+word+'"', async (entity) => {
            if (entity == null) {
                console.error("No wordnet entry found! word: '" + word + "', part of speech: '" + pos + "'");
                return resolve(false);
            } else if (pos !== "Word" && pos !== entity.fnclas) {
                console.error("Wordnet entry is not the right part of speech! word: '" + word + "', part of speech: '" + pos + "'");
                return resolve(false);
            } else {
                // found it
                return resolve(true);
            }
        });
    }).catch((error) => {console.error(error)});
    return promise;
}

async function generatePOSTypeTree(POSTypeDefinitionList) {
    const generatedPOSTree = [];
    // iterate through the POS form type definition list for a random type of desired POS
    var i = 0;
    for (const POSTypeDefinitionAbbreviationIndex in POSTypeDefinitionList) {
        i++;
        const POSTypeDefinitionAbbreviation = POSTypeDefinitionList[POSTypeDefinitionAbbreviationIndex];
        console.log("looking for a " + POSTypeDefinitionAbbreviation);
        if (POSTypeDefinitionAbbreviation in basicDictionary) {
            // see basic.yaml
            const basicPOSType = basicDictionary[POSTypeDefinitionAbbreviation];
            try {
                var generatedPOS = null;
//                var generatedPOS = await generateBasicPosMiku(generatedPOSTree, i);
                if (generatedPOS == null) {
                    generatedPOS = await generateBasicPosFreq(basicPOSType);
                }
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
    generateBasicPosMiku: generateBasicPosMiku,
    generateBasicPosFreq: generateBasicPosFreq,
    generatePOSTypeTree: generatePOSTypeTree,
    generatePOSTree: generatePOSTree,
    generatePOS: generatePOS,
    generateSentence: generateSentence,
    getRandomInt: getRandomInt,
    treeToString: treeToString,
    checkWordnetFor: checkWordnetFor
}
