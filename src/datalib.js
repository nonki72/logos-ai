'use strict';
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;
var ObjectID = mongo.ObjectID;
const Sql = require('./sql');

const connectOption = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}
var _client = null;


async function getDb() {
	if (_client != null) return _client;
	var url = "mongodb://localhost:27017/";
  _client = await MongoClient.connect(url, connectOption).catch(err => { console.error(err); });
	return _client;
}

//                          ########### READ FUNCTIONS ############




// takes a lambda fragment and min value
// reads most reduced equivalent fragment from its EC (Equivalence Class)
async function readByEquivalenceClass (id) {
	const query = {
		'ecid': entity.ecid
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		let cursor = db.collection('EC').find(query).sort({'size':-1}).limit(1);
		if (cursor.hasNext()) res = await cursor.next();
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

function readByAssociativeValue(sourceId, cb) {
	Sql.getRandomAssociationRecord(sourceId, (err, association) => {
		if (!err && association && association.dstid) {
			return readById(association.dstid, (entity) => {
				if (entity) {
					entity.association = association; // ************************* needed?
					return cb(entity);
				}
			});
		}

      // no assv to report, select at random
			return readFreeIdentifierByRandomValue(cb);
			//readbyrandomvalue() // todo: also want abs & apps
	});
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
		readAbstractionByRandomValue(function(res) {
			if (res) return cb(res);
		  return readFreeIdentifierByRandomValue(cb);
		});
	} else {
		return readFreeIdentifierByRandomValue(cb);
	}
}

// randomly reads an abs fragment
// may be suitable for using as a lhs to apply to input
async function readAbstractionByRandomValue (cb) {
	const query = {
		'type': 'abs',
		'invalid': false,
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		let cursor = db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
		if (cursor.hasNext()) res = await cursor.next();
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

// randomly reads a free fragment
// may be suitable for using as a lhs to apply to input
async function readFreeIdentifierByRandomValue (cb) {
	const query = {
		'type': 'free',
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		let cursor = db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
    if (cursor.hasNext()) res = await cursor.next();
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readFreeIdentifierByName (name, cb) {
	const query = {
		'type': 'free',
		'name': name
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		res = await db.collection('Diary').findOne(query);
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readFreeIdentifierByFn (fn, cb) {
	const query = {
		'type': 'free',
		'fn': fn
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		res = await db.collection('Diary').findOne(query);
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readRandomFreeIdentifierFnThatTakesArgs (cb) {
	const query = {
		'argn': {$gte: 1},
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		let cursor = db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
		if (cursor.hasNext()) res = await cursor.next();
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

// randomly reads a fragment
async function readByRandomValue (cb) {
	const query = {
		'invalid': false,
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		let cursor = db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
		if (cursor.hasNext()) res = await cursor.next();
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readFreeIdentifierByTypeAndRandomValue (fntype, cb) {
	const query = {
		'fntype': fntype,
		'rand': {$lte: Math.random()}
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		let cursor = db.collection('Diary').find(query).sort({'rand':-1}).limit(1);
		if (cursor.hasNext()) res = await cursor.next();
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readById (id, cb) {
	const query = {
		'id': new ObjectID(id)
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		res = await db.collection('Diary').findOne(query);
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readClassByName(name, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		res = await db.collection('Class').findOne(query);
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readModuleByName(name, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		res = await db.collection('Module').findOne(query);
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}

async function readModuleByPath(path, cb) {
	const query = {
		'path': path
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
		res = await db.collection('Module').findOne(query);
  } catch(err) {
  	console.error(err);
  }
  return cb(res);
}




//                     ######### WRITE FUNCTIONS ############


async function readOrCreateAbstraction (name, definition2, cb) {
	const query = {
		'type': 'abs',
//		'name': name,
		'def2': definition2
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
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
		const db = client.db("logos");
  	res = db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
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
	var res = null;
	try {
		const db = client.db("logos");
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
		const db = client.db("logos");
  	res = db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
  }

  return cb(data);
}

async function readOrCreateFreeIdentifier ( name, cb ) {
	const query = {
		'type': 'free',
		'name': name
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
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
		const db = client.db("logos");
  	res = db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
  }

  return cb(data);
}

async function readOrCreateFreeIdentifierFunction (name, astid, fn, fntype, fnclass, argnum, argtypes, modules, memoize, cb) {
	const query = {
		'type': 'free',
		'name': name
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
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
		const db = client.db("logos");
  	res = db.collection('Diary').insertOne(data);
  } catch (err) {
  	console.error(err);
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
	var res = null;
	try {
		const db = client.db("logos");
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
		const db = client.db("logos");
  	res = db.collection('Diary').insertOne(data);

  	// invalidate old app/sub anchored here
  	const queryOld = {
  		location1: location1
  	};
  	var resOld = db.collection('Diary').updateOne(queryOld, {$set:{invalid:true}});
  } catch (err) {
  	console.error(err);
  }

  return cb(data);
}

async function readOrCreateClass (name, module, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
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
		const db = client.db("logos");
  	res = db.collection('Class').insertOne(data);
  } catch (err) {
  	console.error(err);
  }

  return cb(data);
}

async function readOrCreateModule (name, path, cb) {
	const query = {
		'name': name
	};
	var client = await getDb();
	var res = null;
	try {
		const db = client.db("logos");
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
		const db = client.db("logos");
  	res = await db.collection('Module').insertOne(data);
  } catch (err) {
  	console.error(err);
  }

  return cb(data);
}

async function update (data, cb) {
	const query = {
		'id': data.id
	};

  var res = null;
  try {
		const db = client.db("logos");
  	res = await db.updateOne(query, data);
  } catch (err) {
  	console.error(err);
  }

  return cb(res);
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
	readByAssociativeValue: readByAssociativeValue,
	readFreeIdentifierByTypeAndRandomValue: readFreeIdentifierByTypeAndRandomValue,
	readRandomFreeIdentifierFnThatTakesArgs: readRandomFreeIdentifierFnThatTakesArgs,
	readById: readById,
	readClassByName: readClassByName,
	readModuleByName: readModuleByName,
	readModuleByPath: readModuleByPath,
	readOrCreateAbstraction: readOrCreateAbstraction,
	readOrCreateApplication: readOrCreateApplication,
	readOrCreateFreeIdentifier: readOrCreateFreeIdentifier,
	readOrCreateFreeIdentifierFunction: readOrCreateFreeIdentifierFunction,
	readOrCreateSubstitution: readOrCreateSubstitution,
	readOrCreateClass: readOrCreateClass,
	readOrCreateModule: readOrCreateModule,
	update: update,
};
