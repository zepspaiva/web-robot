var Q = require('q');

var Tasks = require('./tasks.js');
var TaskExec = require('./taskexec.js');

var t = new Tasks();
var te = new TaskExec();

exports.new = function(prefix, task, data) {

	var taskid = req.params.taskid;
		
	return t.getTask(taskid)
	.then(function(task) {

		var taskexec = new TaskExec(task);
		res.redirect(['/', prefix, '/next/', taskexec.uuid].join(''));

	})
	.catch(function(err) {
		console.log(err.stack);
		res.status(404).send(err.message);
	});

}

exports.setup = function(prefix, app) {

	app.get(['/', prefix, '/*'].join(''), function(req, res) {

		var sess = req.session;
		if (!sess || !sess.taskexecuuid) return res.status(404).send('No session.');

		return te.getTaskExec(sess.taskexecuuid)
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

		return te.getTaskExec(sess.taskexecuuid)
		.then(function(taskexec) {

			return taskexec.runRequest('POST', req, res, req.url);

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	app.get(['/', prefix, '/next/:taskexecuuid'].join(''), function(req, res) {

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

}
