var Q = require('q');

var Tasks = require('./tasks.js');
var TaskExec = require('./taskexec.js');

function WebRobot(basepath, prefix, debug) {

	this.t = new Tasks(basepath);
	this.te = new TaskExec();
	this.prefix = prefix || '';
	this.debug = debug || false;

}

WebRobot.prototype.listTasks = function() {

	var self = this;

	return self.t.getTasks();

}

WebRobot.prototype.createTaskExecution = function(taskid) {
	
	var self = this;

	return self.t.getTask(taskid)
	.then(function(task) {

		var taskexec = new TaskExec(task);
		return taskexec.uuid;

	})
	.catch(function(err) {
		console.log(err.stack);
		throw err;
	});

}

WebRobot.prototype.setupRoutes = function(app) {

	var self = this;

	if (self.debug) console.log('Registering: ', [self.prefix, '/next/:taskexecuuid'].join(''));
	app.get([self.prefix, '/next/:taskexecuuid'].join(''), function(req, res) {

		var taskexecuuid = req.params.taskexecuuid;

		var sess = req.session;
		sess.taskexecuuid = taskexecuuid;
		
		return self.te.getTaskExec(taskexecuuid)
		.then(function(taskexec) {

			var step = taskexec.nextStep();
			res.redirect(step.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	if (self.debug) console.log('Registering: ', [self.prefix, '/current/:taskexecuuid'].join(''));
	app.get([self.prefix, '/current/:taskexecuuid'].join(''), function(req, res) {

		var taskexecuuid = req.params.taskexecuuid;

		var sess = req.session;
		sess.taskexecuuid = taskexecuuid;
		
		return self.te.getTaskExec(taskexecuuid)
		.then(function(taskexec) {

			var step = taskexec.curStep();
			res.redirect(step.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	if (self.debug) console.log('Registering: ', [self.prefix, '/*'].join(''));
	app.get([self.prefix, '/*'].join(''), function(req, res) {

		var sess = req.session;
		if (!sess || !sess.taskexecuuid) return res.status(404).send('No session.');

		return self.te.getTaskExec(sess.taskexecuuid)
		.then(function(taskexec) {

			return taskexec.runRequest('GET', req, res, req.url.substr(self.prefix.length));

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	if (self.debug) console.log('Registering: ', [self.prefix, '/*'].join(''));
	app.post([self.prefix, '/*'].join(''), function(req, res) {

		var sess = req.session;
		if (!sess || !sess.taskexecuuid) return res.status(404).send('No session.');

		return self.te.getTaskExec(sess.taskexecuuid)
		.then(function(taskexec) {

			return taskexec.runRequest('POST', req, res, req.url.substr(self.prefix.length));

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

}

module.exports = WebRobot;