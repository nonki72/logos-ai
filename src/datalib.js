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
	   	var entities = entities;
	  	if (entities.length) {
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

// takes an input fragment and randomly reads a fragment
// suitable for using as a lhs to apply to the input
function readByAssociativeValue (input) {
	const query = datastore.ds.createQuery('Diary')
//   .filter('assv', '>=', associativeMinimum)
   .filter('argCount', '=', 1)
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
   	var entities = entities;
  	if (entities.length) {
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
  	if (abstractions.length) {
	   	var abstraction = abstractions[Object.keys(abstractions)[0]];
	   	abstraction.id = abstraction[datastore.ds.KEY]['id'];
	   	console.log(abstraction);
  		return cb(abstraction);
  	}

		// if not found
	  var data = {
	  	type: 'abs',
	  	name: name,
	  	def2: definition2
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
  	if (applications.length) {
	   	var application = applications[Object.keys(applications)[0]];
	   	application.id = application[datastore.ds.KEY]['id'];
	   	console.log(application);
  		return cb(application);
  	}

		// if not found
	  var data = {
	  	type: 'app',
	  	def1: definition1,
	  	def2: definition2
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
  	if (identifiers.length) {
	   	var identifier = identifiers[Object.keys(identifiers)[0]];
	   	identifier.id = identifier[datastore.ds.KEY]['id'];
	   	console.log(identifier);
  		return cb(identifier);
  	}

		// if not found
	  var data = {
	  	type: 'id',
	  	indx: index
	  };
		datastore.create('Diary', data, function(err, entity){
			if (err) {
				console.log("diary err "+err);
			}
	    return cb( entity);
		});
	});
}

function readFreeIdentifier ( name, cb ) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'free')
   .filter('name', '=', name)
   .limit(1);
  datastore.ds.runQuery(query, (err, entities, nextQuery) => {
   	var identifiers = entities;
  	if (identifiers.length) {
	   	var identifier = identifiers[Object.keys(identifiers)[0]];
	   	identifier.id = identifier[datastore.ds.KEY]['id'];
	   	console.log(identifier);
  		return cb(identifier);
  	}

		// if not found
		console.log("Diary error: could not find free identifier '"+name+"'");
		return cb(undefined);
	});
}

function createFreeIdentifier (name, ast, fn, fntype, argn, argTypes, cb) {
  var data = {
  	type: 'free',
  	name: name,
    ast: ast, // location (id)
    fn: fn,
    fntype: fntype,
    argn: argn,
    argt: argTypes
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
	  	def2: location2,
	    rand: Math.random()
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


module.exports = {
	readOrCreateAbstraction: readOrCreateAbstraction,
	readOrCreateApplication: readOrCreateApplication,
	readOrCreateIdentifier: readOrCreateIdentifier,
	readFreeIdentifier: readFreeIdentifier,
	createFreeIdentifier: createFreeIdentifier,
	createSubstitution: createSubstitution,
	readByAssociativeValue: readByAssociativeValue,
	readByEquivalenceClass: readByEquivalenceClass
};