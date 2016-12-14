var Q = require('q');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require("body-parser");
var session = require('express-session');

var WebRobot = require('../index.js');

var app = express();
var port = 3003;

var tasksfolderpath = 'mapping/tasks';
var mapsfolderpath = 'mapping/maps';

function main() {

	var webrobot = new WebRobot(tasksfolderpath, null, true);

	app.use(function(req, res, next) {
		req.rawBody = '';
		req.setEncoding('utf8');
		req.on('data', function(chunk) {
			req.rawBody += chunk;
		});
		req.on('end', function() {
			next();
		});
	});

	app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));

	app.get('/', function(req, res) {

		return webrobot.listTasks()
		.then(function(tasks) {

			var html = '';

			tasks.sort(function(t1, t2) {
				return t1.name > t2.name;
			});

			return tasks.reduce(function(p, task) {
				return p.then(function() {
					html += ["<a href='./run/", task.id ,"'>", task.name, "</a><br/>"].join('');
				});
			}, Q())
			.then(function() {
				res.status(200).send(html);
			})
			.catch(function(err) {
				console.log(err.stack);
				res.status(404).send(err.message);
			});

		});

	});

	app.get('/run/:taskid', function(req, res) {

		var taskid = req.params.taskid;
		var data = JSON.parse(fs.readFileSync(path.join(mapsfolderpath, taskid.replace(/\.task$/, '') + '.map.json')));

		return webrobot.createTaskExecution(taskid, data)
		.then(function(taskexecuuid) {

			res.redirect(['/next/', taskexecuuid].join(''));

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	webrobot.setupRoutes(app);

	app.listen(port, function () {

		console.log('Listening on port', port);

	});

}

main();