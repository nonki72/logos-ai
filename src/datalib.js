'use strict';
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var ObjectID = mongo.ObjectID;
const Sql = require('./sql');

const connectOption = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}



async function getDb() {
	var url = "mongodb://localhost:27017/";
  const client = await MongoClient.connect(url, connectOption).catch(err => { console.error(err); });
	return client;
}

//                          ########### READ FUNCTIONS ############




// takes a lambda fragment and min value
// reads most reduced equivalent fragment from its EC (Equivalence Class)
async function readByEquivalenceClass (id) {
	const query = {
		'ecid': entity.ecid
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('EC').find(query).sort({'size':-1}).limit(1);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

// reads applicator based on probabilistic selection of matching associations
function readApplicatorByAssociativeValue(sourceId, cb) {
	Sql.getRandomAssociationRecord(sourceId, (err, association) => {
		if (!err && association && association.dstid) {
			console.log("$$$ A1 $$$");
			return readById(association.dstid, (entity) => {
				if (entity) {
					entity.association = association; // ************************* needed?
					return cb(entity);
				}
			});
		}

      // no assv to report, select at random
			console.log("$$$ A3 $$$");
			return readApplicatorByRandomValue(cb);
	});
}

// randomly reads an abs or free id fragment
// may be suitable for using as a lhs to apply to input
function readApplicatorByRandomValue (cb) {
	if (Math.random() > 0.5) {
		return readAbstractionByRandomValue(cb);
	} else {
		return readFreeIdentifierByRandomValue(cb);
	}
}

// randomly reads an abs fragment
// may be suitable for using as a lhs to apply to input
async function readAbstractionByRandomValue (cb) {
	const query = {
		'type': 'abs',
		'invalid': 'false',
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

// randomly reads a free fragment
// may be suitable for using as a lhs to apply to input
async function readFreeIdentifierByRandomValue (cb) {
	const query = {
		'type': 'free',
		'invalid': 'false',
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

async function readFreeIdentifierByName (name, cb) {
	const query = {
		'type': 'free',
		'name': name
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

async function readFreeIdentifierByFn (fn, cb) {
	const query = {
		'type': 'free',
		'fn': fn
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

// randomly reads a fragment
async function readByRandomValue (cb) {
	const query = {
		'invalid': 'false',
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}
//**************************************************************************************************************TODO:MYSQL
async function readAssociationByIds(sourceId, destId, cb) {
	const query = datastore.ds.createQuery('Association')
	 .filter('srcid', '=', sourceId)
   .filter('dstid', '=', destId)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
//	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}

async function readById (id, cb) {
	const query = {
		'id': new ObjectID(id)
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

async function readClassByName(name, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Class').findOne(query);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

async function readModuleByName(name, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Module').findOne(query);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}

async function readModuleByPath(path, cb) {
	const query = {
		'path': path
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Module').findOne(query);
  } catch(err) {
  	console.error(err);
  } finally {
  	client.close();
  }
  return cb(res);
}




//                     ######### WRITE FUNCTIONS ############



//****************************************************************************************TODO MYSQL
function readOrCreateAssociation (sourceId, destId, associativeValue, cb) {
	const query = datastore.ds.createQuery('Association')
   .filter('srcid', '=', sourceId)
   .filter('dstid', '=', destId)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
  		return cb(entity);
  	}

		// if not found
	  var data = {
	  	srcid: sourceId,
	  	dstid: destId,
		  assv: associativeValue
	  };
		datastore.create('Association', data, function(err, entity){
			if (err) {
				console.log("association err ", err);
	  		return cb(null);
			}
	    return cb(entity);
		});
  });
}


async function readOrCreateAbstraction (name, definition2, cb) {
	const query = {
		'type': 'abs',
//		'name': name,
		'def2': definition2
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
		if (res) {
			client.close();
			return cb(res);
		}
  } catch(err) {
  	console.error(err);
  }

	// if not found
  var data = {
  	id: new ObjectID(),
  	type: 'abs',
  	name: name,
  	def2: definition2,
  	invalid: false,
    rand: Math.random()
  };

  try {
		const db = await client.db("logos");
  	res = await db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(data);
}

async function readOrCreateApplication (definition1, definition2, cb) {
	const query = {
		'type': 'app',
		'def1': definition1,
		'def2': definition2
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
		if (res) {
			client.close();
			return cb(res);
		}
  } catch(err) {
  	console.error(err);
  }

	// if not found
  var data = {
  	id: new ObjectID(),
  	type: 'app',
  	def1: definition1,
  	def2: definition2,
  	invalid: false,
    rand: Math.random()
  };

  try {
		const db = await client.db("logos");
  	res = await db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(data);
}

async function readOrCreateFreeIdentifier ( name, cb ) {
	const query = {
		'type': 'free',
		'name': name
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
		if (res) {
			client.close();
			return cb(res);
		}
  } catch(err) {
  	console.error(err);
  }

	// if not found
  var data = {
  	id: new ObjectID(),
  	type: 'free',
  	name: name,
  	argn: 0,
    rand: Math.random()
  };

  try {
		const db = await client.db("logos");
  	res = await db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(data);
}

async function readOrCreateFreeIdentifierFunction (name, astid, fn, fntype, fnclass, argnum, argtypes, modules, memoize, dbo, cb) {
	const query = {
		'type': 'free',
		'name': name
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
		if (res) {
			client.close();
			return cb(res);
		}
  } catch(err) {
  	console.error(err);
  }

	// if not found
  var data = {
  	id: new ObjectID(),
  	type: 'free',
  	name: name,
    astid: astid, // location (id)
    fn: fn,
    fntype: fntype,
    fnclas: fnclass,
    argn: argnum,
    argt: argtypes,
    mods: modules,
    memo: memoize,
	  rand: Math.random()
  };
  try {
		const db = await client.db("logos");
  	res = await db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(data);
}


async function readOrCreateSubstitution (subType, location1, location2, cb) {
  if (subType == 'beta') {
    // check that action1 lhs is abstraction
  }

	const query = {
		'type': 'sub',
		'styp': subType,
		'def1': location1,
		'def2': location2
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Diary').findOne(query);
		if (res) {
			client.close();
			return cb(res);
		}
  } catch(err) {
  	console.error(err);
  }

	// if not found
  var data = {
  	id: new ObjectID(),
  	type: 'sub',
  	styp: subType,
  	def1: location1,
  	def2: location2
  };
  try {
		const db = await client.db("logos");
  	res = await db.collection('Diary').insertOne(data);

  	// invalidate old app/sub anchored here
  	const queryOld = {
  		location1: location1
  	};
  	let resOld = await db.collection('Diary').updateOne(queryOld, {$set:{invalid:true}});
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(data);
}

async function readOrCreateClass (name, module, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Class').findOne(query);
		if (res) {
			client.close();
			return cb(res);
		}
  } catch(err) {
  	console.error(err);
  }

	// if not found
  var data = {
  	id: new ObjectID(),
  	name: name,
  	module: module
  };
  try {
		const db = await client.db("logos");
  	res = await db.collection('Class').insertOne(data);
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(data);
}

async function readOrCreateModule (name, path, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	let res;
	try {
		const db = await client.db("logos");
		res = await db.collection('Module').findOne(query);
		if (res) {
			client.close();
			return cb(res);
		}
  } catch(err) {
  	console.error(err);
  }

	// if not found
  var data = {
  	id: new ObjectID(),
  	name: name,
  	path: path
  };
  try {
		const db = await client.db("logos");
  	res = await db.collection('Module').insertOne(data);
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(data);
}

async function update (data, cb) {
	const query = {
		'id': data.id
	};

  let res;
  try {
		const db = await client.db("logos");
  	res = await db.updateOne(query, data);
  } catch (err) {
  	console.error(err);
  } finally {
  	client.close();
  }

  return cb(res);
}

//**************************************************************************** TODO MYSQL
function updateAssociation (data, cb) {
	datastore.update('Association', data.id, data, function(err) {
		if (err) {
			console.log("update (lib) error: " + err);
			return cb(false);
		}
		return cb(true);
	});
}

module.exports = {
	readByEquivalenceClass: readByEquivalenceClass,
	readApplicatorByAssociativeValue: readApplicatorByAssociativeValue,
	readApplicatorByRandomValue: readApplicatorByRandomValue,
	readAbstractionByRandomValue: readAbstractionByRandomValue,
  readFreeIdentifierByRandomValue: readFreeIdentifierByRandomValue,
  readFreeIdentifierByName: readFreeIdentifierByName,
  readFreeIdentifierByFn: readFreeIdentifierByFn,
	readByRandomValue: readByRandomValue,
	readAssociationByIds: readAssociationByIds,
	readById: readById,
	readClassByName: readClassByName,
	readModuleByName: readModuleByName,
	readModuleByPath: readModuleByPath,
	readOrCreateAssociation:readOrCreateAssociation,
	readOrCreateAbstraction: readOrCreateAbstraction,
	readOrCreateApplication: readOrCreateApplication,
	readOrCreateFreeIdentifier: readOrCreateFreeIdentifier,
	readOrCreateFreeIdentifierFunction: readOrCreateFreeIdentifierFunction,
	readOrCreateSubstitution: readOrCreateSubstitution,
	readOrCreateClass: readOrCreateClass,
	readOrCreateModule: readOrCreateModule,
	update: update,
	updateAssociation: updateAssociation
};
