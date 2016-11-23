var Q = require('q');
var request = require('request');
var uuid = require('uuid');
var path = require('path');
var fs = require('fs');

var Step = require('./step.js');
var WebClient = require('./webclient.js');

var taskexecs = {};

function TaskExec(task) {

	this.task = task;
	this.jar = request.jar();
	this.context = {};
	this.uuid = uuid.v1();
	
	this.webclient = new WebClient(this.task, this.jar);

	taskexecs[this.uuid] = this;

};

TaskExec.prototype.getTaskExec = function(uuid) {

	var self = this;
	var p = Q();

	return p
	.then(function() {
		if (!(uuid in taskexecs)) throw new Error('Task exec not found:' + uuid);
		return taskexecs[uuid];
	});

}

TaskExec.prototype.nextStep = function() {

	var self = this;
	self.context.curstep = self.context.curstep != null ? self.context.curstep : -1;
	
	var validstep = null;
	while (self.context.curstep < self.task.steps.length-1 && validstep == null) {
		self.context.curstep++;
		var step = new Step(self.task.steps[self.context.curstep]);
		validstep = step.isValid() ? step : null;
	}

	return validstep;

};

TaskExec.prototype.curStep = function() {

	var self = this;
	
	return new Step(self.task.steps[self.context.curstep], self.prefix);

};

TaskExec.prototype.runRequest = function(method, req, res, url) {

	var self = this;

	return self.webclient.runRequest(self, method, req, res, url);

};

module.exports = TaskExec;