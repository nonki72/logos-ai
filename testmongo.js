'use strict';
const Grammar = require('./src/grammar');
const DataLib = require('./src/datalib');

async function testfunction()
{
    const randomPOS = await Grammar.generatePOS("Noun");
    //const randomPOS = await DataLib.readFreeIdentifierValueByRandomValue('object', 'Grammar', 'Noun');

    console.log(randomPOS);
    process.exit();
}

testfunction();
