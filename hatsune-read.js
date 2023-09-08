  const DataLib = require('./src/datalib');
  const brain = require('brain.js');
  const zlib = require('zlib');


  // args
  const inputFilename = "./hatsune-training-data.json"

  // read
  // get readline code from database (not hard coded i/o here, rely on sensei)
  async function getFreeIdentifierByName (name) {
    return new Promise((resolve, reject) => {
        DataLib.readFreeIdentifierByName(name, (freeIdentifier) => {
            if (freeIdentifier == null) {
                return reject("couldn't retrieve "+name+" from database");
            }
            return resolve(freeIdentifier);
        });
    });
  }

  async function run() {
    // use above code to read from database and convert to DAO objects
    const trainingDataFreeIdentifier = await getFreeIdentifierByName("HatsuneMikuTrainingDataLyrics")
      .catch((reason) => {console.error(reason); return null;});
    if (trainingDataFreeIdentifier == null) {
        return setTimeout(run, 1000);
    }


    const buffer = Buffer.from(trainingDataFreeIdentifier.fn, 'base64');
    const trainingOutputData = zlib.inflateSync(buffer);
    const trainingOutputDataJson = JSON.parse(trainingOutputData);

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The training data uses approximately ${Math.round(used * 100) / 100} MB`);
  
    // load
    const lstm = new brain.recurrent.LSTM();
    lstm.fromJSON(trainingOutputDataJson);

    // run
    const run1 = lstm.run('The');
    const run2 = lstm.run('Miku');
    const run3 = lstm.run('Spot');
    const run4 = lstm.run('It');
    
    console.log('run 1: The' + run1);
    console.log('run 2: Miku' + run2);
    console.log('run 3: Spot' + run3);
    console.log('run 4: It' + run4);
  }

  run();