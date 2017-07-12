'use strict';

const datastore = require('./datastore');





//                          ########### READ FUNCTIONS ############




// takes a lambda fragment and min value
// reads most reduced equivalent fragment from its EC (Equivalence Class)
function readByEquivalenceClass (id) {
  datastore.read('EC', id, function(err, entity) {
		const query = datastore.ds.createQuery('EC')
	   .filter('ecid', '=', entity.ecid)
	   .order('size')
	   .limit(1)
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
	  	if (entities && entities.length) {
		   	var entity = entities[Object.keys(entities)[0]];
		   	entity.id = entity[datastore.ds.KEY]['id'];
		   	console.log(entity);
	  		return cb(entity);
	  	}

			// if none found
			return cb(entity);
	  });
  });
}

// reads an applicator fragment using cascading methods
function readApplicatorByAssociativeValue(sourceId, cb) {
	readAssociationByAssociativeValue(sourceId, (association) => {
		if (association && Math.random() > 0.5) {
			console.log("$$$ A1 $$$");
			return readById(association.dstid, (entity) => {
				entity.association = association;
				return cb(entity);
			});
		}

		readAssociationByHighestAssociativeValue(sourceId, (association2) => {
			if (association2 && Math.random > 0.5) {
				console.log("$$$ A2 $$$");
				return readById(association2.dstid, (entity) => {
					entity.association = association2;
					return cb(entity);
				});
			}

      // no assv to report
			console.log("$$$ A3 $$$");
			return readApplicatorByRandomValue(cb);
		});
	});
}


// reads a fragment with highest available associative value
function readAssociationByHighestAssociativeValue (sourceId, cb) {
	const query = datastore.ds.createQuery('Association')
	 .filter('srcid', '=', sourceId)
	 .order('assv', { descending: true })
	 .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
   		// normal case, return entity
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity.srcid, ' => ', entity.dstid);
  		return cb(entity);
  	}

		// if not found
		return cb(null);
  });
}


// reads a fragment with random associative value
function readAssociationByAssociativeValue (sourceId, cb) {
	const query = datastore.ds.createQuery('Association')
	 .filter('srcid', '=', sourceId)
   .filter('assv', '<=', Math.random())
	 .order('assv', { descending: true })
	 .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
   		// normal case, return entity
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity.srcid, ' => ', entity.dstid);
  		return cb(entity);
  	}

		// if not found
		return cb(null);
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
function readAbstractionByRandomValue (cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'abs')
	 .filter('invalid', '=', false)
   .filter('rand', '<=', Math.random())
	 .order('rand', { descending: true })
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}

// randomly reads a free fragment
// may be suitable for using as a lhs to apply to input
function readFreeIdentifierByRandomValue (cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'free')
	 .filter('invalid', '=', false)
   .filter('rand', '<=', Math.random())
	 .order('rand', { descending: true })
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}

function readFreeIdentifierByName (name, cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'free')
   .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}


// randomly reads a fragment
function readByRandomValue (cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('invalid', '=', false)
   .filter('rand', '<=', Math.random())
	 .order('rand', { descending: true })
	 .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
   		// normal case, return entity
	   	var entity = entities[Object.keys(entities)[0]];
	   	// if (entity.type == 'sub') {
	   	// 	// if substitution, use the replacement
			  // datastore.read('Diary', entity.def2, function(err,entity2) {
			  //  	entity2.id = entity2[datastore.ds.KEY]['id'];
			  //  	console.log(entity2);
			  // 	return cb(entity2);
			  // });
	   	// } else {
	   		// normal case, return entity
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log('^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
	   	console.log(entity);
  		return cb(entity);
	  	// }
	  }

		// if not found
		return cb(null);
  });
}

function readAssociationByIds(sourceId, destId, cb) {
	const query = datastore.ds.createQuery('Association')
	 .filter('srcid', '=', sourceId)
   .filter('dstid', '=', destId)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}

function readById (id, cb) {
	datastore.read('Diary', id, function(err, entity) {
		if (err) {
			console.log("readById error: " + err);
			return cb(null);
		}
		return cb(entity);
	});
}

function readClassByName(name, cb) {
	const query = datastore.ds.createQuery('Class')
	 .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}

function readModuleByName(name, cb) {
	const query = datastore.ds.createQuery('Module')
	 .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}

function readModuleByPath(path, cb) {
	const query = datastore.ds.createQuery('Module')
	 .filter('path', '=', path)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
	   	console.log(entity);
  		return cb(entity);
  	}
  	
		// if not found
		return cb(null);
  });
}




//                     ######### WRITE FUNCTIONS ############




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
			entity.id = entity[datastore.ds.KEY]['id'];
	    return cb(entity);
		});
  });
}


function readOrCreateAbstraction (name, definition2, cb) {
	const query = datastore.ds.createQuery('Diary') // TODO: save the lookups for EC. Remove cat's
	 .filter('type', '=', 'abs')
//   .filter('name', '=', name)
   .filter('def2', '=', definition2)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
   	var abstractions = entities;
  	if (abstractions && abstractions.length) {
	   	var abstraction = abstractions[Object.keys(abstractions)[0]];
	   	abstraction.id = abstraction[datastore.ds.KEY]['id'];
	   	console.log(abstraction);
  		return cb(abstraction);
  	}

		// if not found
	  var data = {
	  	type: 'abs',
	  	name: name,
	  	def2: definition2,
	  	invalid: false,
	    rand: Math.random()
	  };
		datastore.create('Diary', data, function(err, entity){
	    return cb(entity);
		});
  });
}

function readOrCreateApplication (definition1, definition2, cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'app')
   .filter('def1', '=', definition1)
   .filter('def2', '=', definition2)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
   	var applications = entities;
  	if (applications && applications.length) {
	   	var application = applications[Object.keys(applications)[0]];
	   	application.id = application[datastore.ds.KEY]['id'];
	   	console.log(application);
  		return cb(application);
  	}

		// if not found
	  var data = {
	  	type: 'app',
	  	def1: definition1,
	  	def2: definition2,
	  	invalid: false,
	    rand: Math.random()
	  };
		datastore.create('Diary', data, function(err, entity) {
	    return cb(entity);
		});
  });
}


function readOrCreateIdentifier ( index, cb ) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'id')
   .filter('indx', '=', index)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
   	var identifiers = entities;
  	if (identifiers && identifiers.length) {
	   	var identifier = identifiers[Object.keys(identifiers)[0]];
	   	identifier.id = identifier[datastore.ds.KEY]['id'];
	   	console.log(identifier);
  		return cb(identifier);
  	}

		// if not found
	  var data = {
	  	type: 'id',
	  	indx: index,
	    rand: Math.random()
	  };
		datastore.create('Diary', data, function(err, entity){
			if (err) {
				console.log("diary err "+err);
			}
	    return cb( entity);
		});
	});
}

function readOrCreateFreeIdentifier ( name, cb ) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'free')
   .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
   	var identifiers = entities;
  	if (identifiers && identifiers.length) {
	   	var identifier = identifiers[Object.keys(identifiers)[0]];
	   	identifier.id = identifier[datastore.ds.KEY]['id'];
	   	console.log(identifier);
  		return cb(identifier);
  	}

		// if not found
	  var data = {
	  	type: 'free',
	  	name: name,
	  	argn: 0,
	    rand: Math.random()
	  };
		datastore.create('Diary', data, function(err, entity){
			if (err) {
				console.log("diary err "+err);
			}
	    return cb( entity);
		});
	});
}

function readOrCreateFreeIdentifierFunction (name, astid, fn, fntype, fnclass, argnum, argtypes, modules, memoize,  cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'free')
   .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
  		return cb(entity);
  	}

	  var data = {
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
		datastore.create('Diary', data, function(err, entity){
			if (err) {
				console.log("diary err "+err);
			}
			entity.id = entity[datastore.ds.KEY]['id'];
	    return cb( entity);
		});
	});
}

function readOrCreateSubstitution (subType, location1, location2, cb) {
  if (subType == 'beta') {
    // check that action1 lhs is abstraction
  }
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'sub')
   .filter('styp', '=', subType)
   .filter('def1', '=', location1)
   .filter('def2', '=', location2)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
  		return cb(entity);
  	}

	  // actually create the substitution
	  var createSub = function(err,entity) {
		  var data = {
		  	type: 'sub',
		  	styp: subType,
		  	def1: location1,
		  	def2: location2
		  };
			datastore.create('Diary', data, function(err, newEntity){
				newEntity.id = newEntity[datastore.ds.KEY]['id'];
	  	  return cb( newEntity);
			});
		};

	  // invalidate the old cat/sub anchored here
	  datastore.read('Diary', location1, function(err,entity) {
	  	entity.invalid = true;
	  	datastore.update('Diary', location1, entity, createSub);
	  });
  });
}

function readOrCreateClass (name, module, cb) {
	const query = datastore.ds.createQuery('Class')
   .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
  		return cb(entity);
  	}

	  var data = {
	  	name: name,
		  module: module
	  };
		datastore.create('Class', data, function(err, entity){
			if (err) {
				console.log("class err "+err);
			}
			entity.id = entity[datastore.ds.KEY]['id'];
	    return cb(entity);
		});
	});
}

function readOrCreateModule (name, path, cb) {
	const query = datastore.ds.createQuery('Module')
   .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
	   	var entity = entities[Object.keys(entities)[0]];
	   	entity.id = entity[datastore.ds.KEY]['id'];
  		return cb(entity);
  	}

		// if not found
	  var data = {
	  	name: name,
		  path: path
	  };
		datastore.create('Module', data, function(err, entity){
			if (err) {
				console.log("module err "+err);
			}
			entity.id = entity[datastore.ds.KEY]['id'];
	    return cb(entity);
		});
	});
}

function update (data, cb) {
	datastore.update('Diary', data.id, data, function(err) {
		if (err) {
			console.log("update (lib) error: " + err);
			return cb(false);
		}
		return cb(true);
	});
}

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
	readAssociationByHighestAssociativeValue: readAssociationByHighestAssociativeValue,
	readAssociationByAssociativeValue: readAssociationByAssociativeValue,
	readApplicatorByRandomValue: readApplicatorByRandomValue,
	readAbstractionByRandomValue: readAbstractionByRandomValue,
  readFreeIdentifierByRandomValue: readFreeIdentifierByRandomValue,
  readFreeIdentifierByName: readFreeIdentifierByName,
	readByRandomValue: readByRandomValue,
	readAssociationByIds: readAssociationByIds,
	readById: readById,
	readClassByName: readClassByName,
	readModuleByName: readModuleByName,
	readModuleByPath: readModuleByPath,
	readOrCreateAssociation:readOrCreateAssociation,
	readOrCreateAbstraction: readOrCreateAbstraction,
	readOrCreateApplication: readOrCreateApplication,
	readOrCreateIdentifier: readOrCreateIdentifier,
	readOrCreateFreeIdentifier: readOrCreateFreeIdentifier,
	readOrCreateFreeIdentifierFunction: readOrCreateFreeIdentifierFunction,
	readOrCreateSubstitution: readOrCreateSubstitution,
	readOrCreateClass: readOrCreateClass,
	readOrCreateModule: readOrCreateModule,
	update: update,
	updateAssociation: updateAssociation
};