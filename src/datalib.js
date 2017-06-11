'use strict';

const datastore = require('./datastore');

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


// randomly reads a fragment
function readByAssociativeValue (cb) {
	const query = datastore.ds.createQuery('Diary')
   .filter('assv', '>=', Math.random())
	 .order('assv', { descending: true })
	 .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
  	if (entities && entities.length) {
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
	   	console.log(entity);
  		return cb(entity);
	  	// }
  	}

		// if not found
		return cb(null);
  });
}

// randomly reads a fragment
// suitable for using as a lhs to apply to input
function readAbstractionByAssociativeValue (cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'abs')
   .filter('assv', '>=', Math.random())
	 .order('assv', { descending: true })
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
	    assv: Math.random()
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
	    assv: Math.random()
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
	    assv: Math.random()
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
	    assv: Math.random()
	  };
		datastore.create('Diary', data, function(err, entity){
			if (err) {
				console.log("diary err "+err);
			}
	    return cb( entity);
		});
	});
}

function createFreeIdentifier (name, astid, fn, fntype, argn, argTypes, cb) {
  var data = {
  	type: 'free',
  	name: name,
    astid: astid, // location (id)
    fn: fn,
    fntype: fntype,
    argn: argn,
    argt: argTypes,
	  assv: Math.random()
  };
	datastore.create('Diary', data, function(err, entity){
		if (err) {
			console.log("diary err "+err);
		}
    return cb( entity);
	});
}

function createSubstitution (subType, location1, location2, cb) {
  if (subType == 'beta') {
    // check that action1 lhs is abstraction
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
  	  return cb( newEntity);
		});
	};

  // invalidate the old cat/sub anchored here
  datastore.read('Diary', location1, function(err,entity) {
  	entity.invalid = true;
  	datastore.update('Diary', location1, entity, createSub);
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

module.exports = {
	readOrCreateAbstraction: readOrCreateAbstraction,
	readOrCreateApplication: readOrCreateApplication,
	readOrCreateIdentifier: readOrCreateIdentifier,
	readOrCreateFreeIdentifier: readOrCreateFreeIdentifier,
	createFreeIdentifier: createFreeIdentifier,
	createSubstitution: createSubstitution,
	readByAssociativeValue: readByAssociativeValue,
	readAbstractionByAssociativeValue: readAbstractionByAssociativeValue,
	readById: readById
};