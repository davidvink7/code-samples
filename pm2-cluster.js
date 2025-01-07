#!/usr/bin/env node

var cluster = require('cluster');

if (cluster.isMaster) {
	var cpuCount = require('os').cpus().length;
	for (var i = 0; i < cpuCount; i += 1) {
		cluster.fork();
	}
	cluster.on('exit', function (worker) {
		console.log("worker " + worker.id + " died :(");
		cluster.fork();
	});
} else {
	var app = require('../app');

	app.set('port', process.env.PORT || 3000);
	app.set('ip', process.env.IP || "0.0.0.0");

	var server = app.listen(app.get('port'), app.get('ip'), function () {
		console.log(`Express server listening on port ${server.address().port}`);
	});
}