var Q = require('q');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var Tasks = require('./tasks.js');
var TaskExec = require('./taskexec.js');

var app = express();
var port = 3003;

var t = new Tasks();
var te = new TaskExec();

function main() {

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

	app.set('trust proxy', 1);

	app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));

	app.get('/', function(req, res) {

		return t.getTasks()
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
		
		return t.getTask(taskid)
		.then(function(task) {

			var taskexec = new TaskExec(task);
			res.redirect(['/next/', taskexec.uuid].join(''));

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	app.get('/next/:taskexecuuid', function(req, res) {

		var taskexecuuid = req.params.taskexecuuid;

		var sess = req.session;
		sess.taskexecuuid = taskexecuuid;
		
		return te.getTaskExec(taskexecuuid)
		.then(function(taskexec) {

			var nextstep = taskexec.nextStep();
			res.redirect(nextstep.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	app.get('/current/:taskexecuuid', function(req, res) {

		var taskexecuuid = req.params.taskexecuuid;

		var sess = req.session;
		sess.taskexecuuid = taskexecuuid;
		
		return te.getTaskExec(taskexecuuid)
		.then(function(taskexec) {

			var nextstep = taskexec.curStep();
			res.redirect(nextstep.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	app.get('/*', function(req, res) {

		var sess = req.session;

		if (!sess || !sess.taskexecuuid) return res.redirect('/');

		return te.getTaskExec(sess.taskexecuuid)
		.then(function(taskexec) {

			return taskexec.runRequest('GET', req, res, req.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	app.post('/*', function(req, res) {

		var sess = req.session;

		if (!sess || !sess.taskexecuuid) return res.redirect('/');

		return te.getTaskExec(sess.taskexecuuid)
		.then(function(taskexec) {

			return taskexec.runRequest('POST', req, res, req.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	app.listen(port, function () {

		console.log('Listening on port', port);

	});

}

main();