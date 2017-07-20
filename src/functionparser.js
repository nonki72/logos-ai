'use strict';
const async = require("async");
const DataLib = require('./datalib');
const F = require('./function');

const nativeTypeNames = ["promise"];
const nativeClassNames = ["entry", "abstraction", "application", "identifier", "association", "substitution"];

// context for evaluating the function body
const contextClosure = function(str, args, modules) {
	var requires = '';
	for (var i = 0; i < modules.length; i++) {
		var module = modules[i];
		requires += `const ${module.name} = require(${module.path});
								`;
	}
	
	const CTX = {
		args: args
	};
	
  return eval(requires + str);            // <=== CODE EXECUTION
}

// retrieves all the modules given storedFunction's module array
function loadModules (moduleNames, cb) {
	if (moduleNames == null || moduleNames.length == 0) {
		return cb([]);
	}
	async.map(modules, (moduleName, callback) => {
		DataLib.readModuleByName(moduleName, (module) => {
			if (module == null) {
				callback('Invalid module \'' + moduleName + '\'');
			}
			callback(null, module);
		});
	}, (err, results) => {
		if (err) {
			return cb([]);
		}

		cb(results);
	});
}

function loadStoredFunction(freeIdentifier) {
	var storedFunction = new F.StoredFunction(freeIdentifier.memo, freeIdentifier.fntype, freeIdentifier.fnclas, freeIdentifier.argt, freeIdentifier.mods, freeIdentifier.fn);
	return storedFunction; 
}

/* parse the given function for consistency and correctness
 *
 * returns null on success, error message on failure
*/
function parseFunction (storedFunction, args, cb) {
	if (!(storedFunction instanceof F.StoredFunction)) {
		return cb('Must be instance of StoredFunction');
	}

  loadModules(storedFunction.modules, (modules) => {
	  var result;
		try {
			result = contextClosure.call(null, storedFunction.functionBody, args, modules);   // <=== CODE EXECUTION
		} catch (e) {
	    if (e instanceof SyntaxError) {
	      return cb(`SyntaxError on line ${e.lineNumber}: ${e.message}`);
	    }

	    return cb(`${e.constructor.name} error on line ${e.lineNumber}: ${e.message}`);
		}

    if (storedFunction.type in nativeTypeNames) {
    	// TODO: actually check if its a promise etc
    } else if (typeof result != new String(storedFunction.type)) {
	    return cb(`storedFunction is type '${typeof result}' and not '${storedFunction.type}'`);
	  }

	  if (typeof result === 'object' || storedFunction.type in nativeTypeNames) {
	  	if (storedFunction.klass in nativeClassNames) {
	  		// TODO: actually check if its a entry etc
	    	return cb(null);
	  	}

	  	return checkClass(storedFunction, cb);
    }

    return cb(null);
  });
}

function executeFunction(storedFunction, args, cb) {
	if (!(storedFunction instanceof F.StoredFunction)) {
		console.error('executeFunction -> Must be instance of StoredFunction');
		return cb(null);
	}

  loadModules(storedFunction.modules, (modules) => {
  	checkArgs(storedFunction.argTypes, args, (err) => {
  		if (err) {
  			console.error("ExecuteFunction error: " + err);
  			return cb(null);
  		}

		  var result;
			try {
				result = contextClosure.call(null, storedFunction.functionBody, args, modules);   // <=== CODE EXECUTION
				return cb(result);
			} catch (e) {
		    if (e instanceof SyntaxError) {
		      console.error(`executeFunction -> SyntaxError on line ${e.lineNumber}: ${e.message}`);
		    }

		    console.error(`executeFunction -> ${e.constructor.name} error on line ${e.lineNumber}: ${e.message}`);
		    cb(null);
			}
  	});
	});
}

function checkClass(testObject, className, cb) {
	if (className in nativeClassNames) return cb(null);

  DataLib.readClassByName(storedFunction.klass, (klass) => {
  	if (klass == null) {
  		return cb(`class name '${className}' is invalid`);
  	}

  	DataLib.readModuleByName(klass.module, (module) => {
    	if (klass == null) {
    		return cb(`class '${klass.name}' belongs to module '${klass.module}' which is invalid`);
    	}

  		if (!(eval(`const ${module.name} = require(${module.path});
  	    	        testObject instanceof ' + ${module.name}.${klass.name}`))) {   // <=== CODE EXECUTION
  			return cb(`object is class '${result.constructor.name}' and not '${module.name}.${klass.name}'`);
  	  }

  	  return cb(null);
    });
  });
}

function checkArgs(argTypes, args, cb) {
	if (!Array.isArray(argTypes)) {
		if (!Array.isArray(args)) {
		  return cb(null);
	  }
		if (args.length > 0) {
			return cb("More args than argTypes");
		}
		return cb(null);
	} 
	if (argTypes.length > 0) {
		return cb("More argTypes than args");
	}

	for (var i = 0; i < args.length; i++) {
		var argType = argTypes[i];
		var arg = args[i];
		if (argType in nativeTypeNames || argType in nativeClassNames) {
			continue;
		}
		if (typeof arg != argType) {
			return cb("Arg `" + arg + "` is type `" + typeof arg + "` and not `" + argType + "`");
		}
	}

	return cb (null);
}

module.exports = {
	loadStoredFunction: loadStoredFunction,
	parseFunction: parseFunction,
	executeFunction: executeFunction
};