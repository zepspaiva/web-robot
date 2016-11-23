var Q = require('q');

var Tasks = require('./tasks.js');
var TaskExec = require('./taskexec.js');

function WebRobot(basepath) {

	this.t = new Tasks(basepath);
	this.te = new TaskExec();

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

WebRobot.prototype.setupRoutes = function(prefix, app) {

	var self = this;

	app.get(['/', prefix, '/next/:taskexecuuid'].join(''), function(req, res) {

		var taskexecuuid = req.params.taskexecuuid;

		var sess = req.session;
		sess.taskexecuuid = taskexecuuid;
		
		return self.te.getTaskExec(taskexecuuid)
		.then(function(taskexec) {

			var nextstep = taskexec.nextStep();
			res.redirect(nextstep.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});
	
	app.get(['/', prefix, '/*'].join(''), function(req, res) {

		var sess = req.session;
		if (!sess || !sess.taskexecuuid) return res.status(404).send('No session.');

		return self.te.getTaskExec(sess.taskexecuuid)
		.then(function(taskexec) {

			return taskexec.runRequest('GET', req, res, req.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	app.post(['/', prefix, '/*'].join(''), function(req, res) {

		var sess = req.session;
		if (!sess || !sess.taskexecuuid) return res.status(404).send('No session.');

		return self.te.getTaskExec(sess.taskexecuuid)
		.then(function(taskexec) {

			return taskexec.runRequest('POST', req, res, req.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

}

module.exports = WebRobot;