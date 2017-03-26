'use strict';

const datastore = require('./datastore');

function readOrCreateAbstraction (name, definition2, cb) {
	const query = datastore.ds.createQuery('Diary') // TODO: save the lookups for EC. Remove cat's
	 .filter('type', '=', 'abs')
//   .filter('name', '=', name)
   .filter('def2', '=', definition2)
   .limit(1);
  datastore.ds.runQuery(query)
   .then((results) => {
   	var abstractions = results[0];
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
  }).catch((reason) => {
    console.log("Diary query error: " + reason);
  });
}

function readOrCreateApplication (definition1, definition2, cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'app')
   .filter('def1', '=', definition1)
   .filter('def2', '=', definition2)
   .limit(1);
  datastore.ds.runQuery(query)
   .then((results) => {
   	var applications = results[0];
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
		datastore.create('Diary', data, function(err, entity){
	    return cb(entity);
		});
  }).catch((reason) => {
    console.log("Diary query error: " + reason);
  });


}


function readOrCreateIdentifier ( index, cb ) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'id')
   .filter('indx', '=', index)
   .limit(1);
  datastore.ds.runQuery(query)
   .then((results) => {
   	var identifiers = results[0];
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


function createSubstitution (subType, action1, location2, cb) {
  if (subType == 'beta') {
    // check that action1 lhs is abstraction
  }

  // replace the following cat
  var patchNextCat = function (entity, newEntity) {
	  // find a following cat (if exists)
		const query = datastore.ds.createQuery('Diary')
		 .filter('type', '=', 'cat')
	   .filter('act1', '=', entity.id);
	  datastore.ds.runQuery(query)
	   .then((results) => {
	  	if (results[0]) {
	  		var result = datastore.fromDatastore(results[0]);
	  		// invalidate this old following cat
	  		// TODO: use async.each() here
	  		result.invalid = true;
	  		datastore.update('Diary', result.id, result, function(err, oldNextEntity){
		  		// create a new cat to reference new sub
		  		var data = {
		  			type: 'cat',
		  			act1: newEntity.id,
		  			def2: results[0].def2,
		  			rand: Math.random()
		  		};
		  		datastore.create('Diary', data, function(err, catEntity) {
		    		return cb(newEntity);
		  		});
	  		});
	  	}
	  });
  }
  
  // actually create the substitution
  var createSub = function(err,entity) {
	  var data = {
	  	type: 'sub',
	  	styp: subType,
	  	act1: entity.act1, // take over the anchor point of old cat/sub
	  	loc2: location2,
	    rand: Math.random()
	  };
		datastore.create('Diary', data, function(err, newEntity){
  	  patchNextCat.call(null, entity, newEntity);
		});
	};

  // invalidate the old cat/sub anchored here
  datastore.read('Diary', action1, function(err,entity) {
  	entity.invalid = true;
  	datastore.update('Diary', action1, entity, createSub);
  });

}


function createConcatenation (action1, definition2, cb) {
  var data = {
  	type: 'cat',
  	act1: action1,
  	def2: definition2,
  	rand: Math.random()
  };

	datastore.create('Diary', data, function(err, entity){
    return cb(entity);
	});
}


module.exports = {
	readOrCreateAbstraction: readOrCreateAbstraction,
	readOrCreateApplication: readOrCreateApplication,
	readOrCreateIdentifier: readOrCreateIdentifier,
	createSubstitution: createSubstitution,
  createConcatenation: createConcatenation
};