var Q = require('q');
var express = require('express');
var session = require('express-session');

var WebRobot = require('../index.js');

var app = express();
var port = 3003;

function main() {

	var webrobot = new WebRobot('../tasks');

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
		
		return webrobot.createTaskExecution(taskid)
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