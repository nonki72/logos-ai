var MongoClient = require('mongodb').MongoClient;
const mongoConfig = require('./keys/mongo.json');
var url = mongoConfig.url;

const connectOption = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

async function setup() {
	const client = await MongoClient.connect(url, connectOption).catch(err => { console.error(err); });
	try {
		const db = await client.db('logos');
	  console.log("Database logos created!");
	  try {
		  var diary = await db.createCollection('Diary');
		  await diary.createIndex({'type': 1, 'fntype': 1, 'fnclas': 1});
		  await diary.createIndex({'type': 1, 'argn': 1, 'fntype': 1, 'fnclas': 1});
		  await diary.createIndex({'type': 1, 'def1': 1, 'def2': 1});
		  await diary.createIndex({'type': 1, 'def2': 1});
		  await diary.createIndex({'type': 1, 'name': 1});
		  await diary.createIndex({'type': 1, 'fn': 1});
		  await diary.createIndex({'argt.0.1': 1, 'argt.0.2': 1, 'argt.0.3': 1});
		  await diary.createIndex({'id': 1}, {unique: true});
		  console.log("Collection Diary created!");
	  } catch {}
	  try {
		  await db.createCollection('Class');
		  console.log("Collection Class created!");
	  } catch {}
	  try {
		  await db.createCollection('Module');
		  console.log("Collection Module created!");
	  } catch {}
	  try {
		  var sub = await db.createCollection('Substitution');
		  await sub.createIndex({'invalid': 1, 'styp': 1, 'def1': 1, 'def2': 1});
		  await sub.createIndex({'invalid': 1, 'def2': 1});
		  await sub.createIndex({'styp': 1, 'def1': 1, 'def2': 1});
		  await sub.createIndex({'def1': 1, 'def2': 1});
		  await sub.createIndex({'id': 1}, {unique: true});
		  console.log("Collection Substitution created!");
	  } catch {}
	  try {
		  var freq = await db.createCollection('WordFreq');
		  await freq.createIndex({'word': 1});
		  await freq.createIndex({'frequency': 1});
		  console.log("Collection WordFreq created!");
	  } catch {}
	} catch (err) {
		console.error(err);
	} finally { 
	  client.close();
	}
}

setup();

