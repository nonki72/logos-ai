const Generate = require('./src/generate');

async function generate()
{
    await Generate.generateTweet();
    //await new Promise(r => setTimeout(r, 2000));
    process.exit();
}

generate();