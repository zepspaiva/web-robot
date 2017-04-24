var Q = require('q');
var request = require('request');
var uuid = require('uuid');
var path = require('path');
var fs = require('fs');

var Step = require('./step.js');
var WebClient = require('./webclient.js');

var DEBUG = true;

var taskexecs = {};

function TaskExec(task, webrobot) {

	this.task = task;
	this.webrobot = webrobot;
	this.jar = request.jar();
	this.context = {};
	this.uuid = uuid.v1();

	//if (DEBUG) console.log('NEW TASK: ', JSON.stringify(task));
	
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
	while (self.context.curstep < self.steps.length-1 && validstep == null) {
		self.context.curstep++;
		var step = new Step(self.steps[self.context.curstep]);
		validstep = step.isValid() ? step : null;
	}

	return validstep;

};

TaskExec.prototype.curStep = function() {

	var self = this;
	
	return new Step(self.steps[self.context.curstep], self.prefix);

};

TaskExec.prototype.runRequest = function(method, req, res, url, host) {

	var self = this;

	return self.webclient.runRequest(self, method, req, res, url, host);

};

TaskExec.prototype.trigger = function(eventtype, data) {

	var self = this;

	self.webrobot.trigger([eventtype, self.uuid].join('-'), data);

};

TaskExec.prototype.setupTaskValues = function(data) {

	var self = this;
	var p = Q();

	self.steps = JSON.parse(JSON.stringify(self.task.steps));

	if (self.steps)
		p = p
		.then(function() {

			var taskprefix = self.task.prefix || '';

			return Q.all(self.steps.map(function(step) {

				step.data = data;
				if (!step.fields) return;

				var stepprefix = [taskprefix, step.prefix].join('_');

				return Q.all(step.fields.map(function(field) {

					var fieldname = [stepprefix, field.name || field.id].join('_');

					if (fieldname in data)
						field['value'] = data[fieldname];
					else if (field['default'])
						field['value'] = field['default'];
					else
						console.log('Undefined field:', fieldname);

				}));

			}));

		});

	if (data.filename)
		p = p
		.then(function() {
			self.filename = data.filename;
		});

	return p;

};

module.exports = TaskExec;