const DataLib = require('./src/datalib');
const async = require('async');
const datastore = require('./src/datastore');

datastore.list('Diary', 1000, null, (err, entities, token) => {
	async.forEachSeries(entities, (entity, cb) => {
		if (entity.invalid === undefined) {
			entity.invalid = false;
			DataLib.update(entity, (err) => {
				cb();
			});
		} else {
			cb();
		}
	}, (err) => {
		console.log('done');
	});
});