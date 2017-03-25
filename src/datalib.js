'use strict';

const datastore = require('./datastore');

function readOrCreateAbstraction (variable1, definition2, cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'abs')
   .filter('var1', '=', variable1)
   .filter('def2', '=', definition2);
  datastore.ds.runQuery(query)
   .then((results) => {
  	return cb(datastore.fromDatastore(results[0]));
  }).catch((reason) => {
    console.log("Diary query error: " + reason);
  });

  var data = {
  	type: 'abs',
  	var1: variable1,
  	def2: definition2
  };
	// if not found
	datastore.create('Diary', data, function(err, entity){
    return cb(entity);
	});
}

function readOrCreateApplication (definition1, definition2, cb) {
	const query = datastore.ds.createQuery('Diary')
	 .filter('type', '=', 'app')
   .filter('def1', '=', definition1)
   .filter('def2', '=', definition2);
  datastore.ds.runQuery(query)
   .then((results) => {
  	return cb(datastore.fromDatastore(results[0]));
  }).catch((reason) => {
    console.log("Diary query error: " + reason);
  });

  var data = {
  	type: 'app',
  	def1: definition1,
  	def2: definition2
  };
	// if not found
	datastore.create('Diary', data, function(err, entity){
    return cb(entity);
	});
}


function readOrCreateIdentifier ( name, cb ) {
  var data = {
  	type: 'id',
  	name: name
  };
	datastore.create('Diary', data, function(err, entity){
		if (err) {
			console.log("diary err "+err);
		}
    return cb( entity);
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