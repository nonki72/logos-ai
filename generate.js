const Generate = require('./src/generate');
const tools = require('./src/tools');

async function generate()
{
    await tools.promisify(Generate.generateTweet)();
    process.exit();
}

generate();