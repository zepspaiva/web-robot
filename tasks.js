var Q = require('q');
var path = require('path');
var fs = require('fs');

var FileSys = require('./filesys.js');

function Tasks(basepath) {

	this.basepath = basepath || './tasks';
	this.taskregex = /.*\.json/i;
	this.filesys = new FileSys();

};

Tasks.prototype._prepare = function() {

	var self = this;
	var tasks = [];
	var taskstree = {};

	return self.filesys.listFiles(self.basepath, self.taskregex)
	.then(function(taskfiles) {

		return Q.all(taskfiles.map(function(taskfile) {
			var taskfilepath = path.join(self.basepath, taskfile);
			return self.filesys.readJsonFile(taskfilepath)
			.then(function(task) {
				task.id = path.basename(taskfile, '.json');
				tasks.push(task);
				taskstree[task.id] = task;
			});
		}));

	})
	.then(function() {
		self.tasks = tasks;
		self.taskstree = taskstree;
		self.ready = true;
	});

};

Tasks.prototype.getTasks = function() {

	var self = this;
	var p = Q();

	if (!self.ready)
		p = p
		.then(function() {
			return self._prepare();
		});

	return p
	.then(function() {
		return self.tasks;
	});

};

Tasks.prototype.getTask = function(taskid) {

	var self = this;
	var p = Q();

	if (!self.ready)
		p = p
		.then(function() {
			return self._prepare();
		});

	return p
	.then(function() {
		if (!(taskid in self.taskstree)) throw new Error('Task not found:' + taskid);
		return self.taskstree[taskid];
	});

};

module.exports = Tasks;