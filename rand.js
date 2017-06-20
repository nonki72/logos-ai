const DataLib = require('./src/datalib');
const async = require('async');
const datastore = require('./src/datastore');

datastore.list('Diary', 1000, null, (err, entities, token) => {
	async.forEachSeries(entities, (entity, cb) => {
			entity.rand = Math.random();
			DataLib.update(entity, (err) => {
				cb();
			});
	}, (err) => {
		console.log('done');
	});
});