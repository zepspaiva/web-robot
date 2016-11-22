var Q = require('q');
var cheerio = require('cheerio');

function Step(config) {

	var self = this;

	self.config = config;
	self.name = config.name;
	self.url = config.url;
	self.fields = config.fields || [];
	self.actions = config.actions || [];
	self.recognition = config.recognition || [];

};

Step.prototype.isValid = function() {

	var self = this;
	var p = Q();

	var valid = true;

	return valid;

};

Step.prototype.recognize = function(html) {

	var self = this;

	if (!self.recognition.length)
		return true;

	var $ = cheerio.load(html);
	var valid = true;

	var i = 0;
	while (valid && i < self.recognition.length) {
		var rule = self.recognition[i];
		if (!rule.query) valid = true;
		
		try {
			valid = eval(rule.query);
		} catch(err) {
			console.log(err.stack);
			valid = false;
		};
		i++;
	}

	return valid;

};

Step.prototype.injectCode = function(html, taskexecuuid) {

	var self = this;

	html += '<script type="text/javascript" src="http://code.jquery.com/jquery-latest.min.js"></script>';

	if (self.fields && self.fields.length) {

		html += '<script type="text/javascript">';
		html += '$(window).on(\'load\', function() {';
		//html += '$(document).ready(function() {';
		//html += 'setTimeout(function() {';

		for (f in self.fields) {

			var field = self.fields[f];
			
			var selector = field.type == 'select' ? 'select' : 'input';
			var selectorfields = ['id', 'name', 'type'];

			if (field.type == 'select') selectorfields = ['id', 'name'];

			for (s in selectorfields) {
				var sf = selectorfields[s];
				if (field[sf]) selector += ['[',sf,'="',field[sf],'"]'].join('');
			}

			if (field.type === 'radio' || field.type === 'checkbox') {

				if (field.checked || field.value == true)
					html += ['$(\'',selector, '\').prop(\'checked\', true);'].join('');

			} else if (field.value) {
				
				html += ['$(\'',selector, '\').val(\'', field.value,'\')', field.trigger ? '.trigger(\'' + field.trigger + '\');' : ';'].join('');

			}

		}

		//html += '}, 400);';
		//html += '});';
		html += '});';
		html += '</script>';

	}

	// Code to run actions...
	if (self.actions && self.actions.length) {

		html += '<script type="text/javascript">';
		html += '$(window).on(\'load\', function() {';
		//html += '$(document).ready(function() {';
		//html += 'setTimeout(function() {';

		for (a in self.actions) {

			var action = self.actions[a];

			if (action.code)
				html += action.code;

			switch (action.type) {

				case "nextstep":
					html += ["window.location = '/current/", taskexecuuid, "';"].join('');
					break;

			}

		}

		//html += '}, 1000);';
		//html += '});';
		html += '});';
		html += '</script>';

	}

	return html;

};

module.exports = Step;