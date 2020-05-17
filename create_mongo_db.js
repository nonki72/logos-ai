var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

const connectOption = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

async function setup() {
	const client = await MongoClient.connect(url, connectOption).catch(err => { console.error(err); });
	try {
		const db = await client.db('logos');
	  console.log("Database logos created!");
	  await db.createCollection('Diary');
	  console.log("Collection Diary created!");
	  await db.createCollection('Class');
	  console.log("Collection Class created!");
	  await db.createCollection('Module');
	  console.log("Collection Module created!");
	} catch (err) {
		console.error(err);
	} finally { 
	  client.close();
	}
}

setup();

