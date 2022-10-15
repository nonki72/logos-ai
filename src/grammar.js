const basicFilePath = 'yaml/basic.yaml';
const phrasesFilePath = 'yaml/phrases.yaml';
const wordsFilePath = 'yaml/words.yaml';
const grammarFilePath = 'yaml/grammar.yaml';
const determinersFilePath = 'text/determiners.txt';
const pronounsFilePath = 'text/pronouns.txt';
const prepositionsFilePath = 'text/prepositions.txt';
const complementizersFilePath = 'text/complementizers.txt';
const DataLib = require('./datalib');
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
wordsListDictionary['Pronoun'] = loadTextFileList(determinersFilePath);
wordsListDictionary['Preposition'] = loadTextFileList(determinersFilePath);
wordsListDictionary['Complementizer'] = loadTextFileList(determinersFilePath);

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

async function generateBasicPOS(pos) {
    const promise = new Promise(async function (resolve, reject) {
        try {
            const randomPOS = await DataLib.readFreeIdentifierValueByRandomValue('object', 'Grammar', pos);
            if (randomPOS == null) {
                return reject("No random POS found! pos: '" + pos + "'");
            }
            const word = randomPOS.fn.replace(/^\"/, '').replace(/\"$/, '');
            return resolve(word);
        } catch (error) {
            return reject(error);
        }
    }).catch((error) => {console.error(error)});
    return promise;
}

async function generatePOSTypeTree(POSTypeDefinitionList) {
    const generatedPOSTree = [];
    // iterate through the POS form type definition list for a random type of desired POS
    for (const POSTypeDefinitionAbbreviationIndex in POSTypeDefinitionList) {
        const POSTypeDefinitionAbbreviation = POSTypeDefinitionList[POSTypeDefinitionAbbreviationIndex];
        if (POSTypeDefinitionAbbreviation in basicDictionary) {
            // Noun: Noun
            // Verb: Verb
            // Adj: Adjective
            // Adv: Adverb
            // AdjSat: AdjectiveSatellite
            const basicPOSType = basicDictionary[POSTypeDefinitionAbbreviation];
            try {
                const generatedPOS = await generateBasicPOS(basicPOSType);
                if (generatedPOSTree.length > 0) generatedPOSTree.push(" ");
                generatedPOSTree.push(generatedPOS);
            } catch (error) {
                console.error(error);
                if (generatedPOSTree.length > 0) generatedPOSTree.push(" ");
                generatedPOSTree.push('(' + basicPOSType + ')');
            }
        } else if (POSTypeDefinitionAbbreviation in phrasesDictionary) {
            // S: Sentence
            // NP: NounPhrase
            // Nom: Nominal
            // VP: VerbPhrase
            // PP: PrepositionalPhrase
            // CP: ComplimenterPhrase
            const generatedPOSTreeTemp = await generatePOSTree(POSTypeDefinitionAbbreviation);
            if (generatedPOSTree.length > 0) generatedPOSTree.push(" ");
            generatedPOSTree.push(generatedPOSTreeTemp);
        } else {
            // Det: Determiner
            // Pron: Pronoun
            // Prep: Preposition
            // C: Complementizer
            const textPOSType = wordsDictionary[POSTypeDefinitionAbbreviation];
            const textPOSList = wordsListDictionary[textPOSType];
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
    if (tree == undefined) return "(?)";
    if (!Array.isArray(tree)) return "(?)";
    var string = '';
    for (const element of tree.values()) {
        if (Array.isArray(element)) {
            string = string + treeToString(element);
        } else if ((typeof element === 'string')) {
            string = string + element;
        } else {
            console.error('element is not string or array (tree): ' + element);
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