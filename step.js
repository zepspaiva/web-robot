var Q = require('q');
var cheerio = require('cheerio');

function Step(config, prefix) {

	var self = this;

	self.config = config;
	self.name = config.name;
	self.url = config.url;
	self.fields = config.fields || [];
	self.actions = config.actions || [];
	self.recognition = config.recognition || [];
	self.condition = config.condition || [];
	self.repeatUntilNotRecognized = config.repeatUntilNotRecognized || false;
	self.data = config.data;
	self.prefix = prefix;

};

Step.prototype.isValid = function() {

	var self = this;
	var valid = true;

	with (self.data) {

		var i = 0;
		while (valid && i < self.condition.length) {
			var rule = self.condition[i];
			if (rule.query) {
				try {
					valid = eval(rule.query);
				} catch(err) {
					valid = false;
				};
			}
			i++;
		}

	}

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
		if (rule.query) {
			try {
				valid = eval(rule.query);
			} catch(err) {
				console.log(err);
				valid = false;
			};
		}
		i++;
	}

	return valid;

};

Step.prototype.injectCode = function(html, taskexecuuid) {

	var self = this;
	var code = '';

	code += ['<script type="text/javascript" src="/', self.prefix, 'static/jquery-latest.min.js"></script>'].join('');
	code += ['<script type="text/javascript" src="/', self.prefix, 'static/spin.min.js"></script>'].join('');
	code += ['<script type="text/javascript" src="/', self.prefix, 'static/webrobot.js"></script>'].join('');

	var timeoutbegin = 'setTimeout(function() {';
	var timeoutend = '}, 10);';
	var timeoutcount = 0;

	code += '<script type="text/javascript">';
	code += '$(window).on(\'load\', function() {';

	if (self.fields && self.fields.length) {

		for (f in self.fields) {

			var field = self.fields[f];
			
			var selector = field.type == 'select' ? 'select' : 'input';
			var selectorfields = ['id', 'name', 'type'];

			code += timeoutbegin;
			timeoutcount++;

			if (field.type == 'select') selectorfields = ['id', 'name'];

			for (s in selectorfields) {
				var sf = selectorfields[s];
				if (field[sf]) selector += ['[',sf,'="',field[sf],'"]'].join('');
			}

			if (field.type === 'radio' || field.type === 'checkbox') {

				if (field.checked || field.value == true)
					code += ['$(\'',selector, '\').prop(\'checked\', true)', field.trigger ? '.trigger(\'' + field.trigger + '\');' : ';'].join('');

			} else if (field.type === 'javascript') {

				code += field.code;

			} else if (field.value) {
				
				if (field.type == 'select') {
					
					code += ['selectclosest(\'',selector, '\', \'', field.value,'\')', field.trigger ? '.trigger(\'' + field.trigger + '\');' : ';'].join('');

				} else {
					
					code += ['$(\'',selector, '\').val(\'', field.value,'\')', field.trigger ? '.trigger(\'' + field.trigger + '\');' : ';'].join('');

				}

			}

		}

	}

	// Code to run actions...
	if (self.actions && self.actions.length) {

		for (a in self.actions) {

			var action = self.actions[a];

			code += timeoutbegin;
			timeoutcount++;

			if (action.code)
				code += action.code;

			if (action.error)
				throw new Error(action.error);

			switch (action.type) {

				case "nextstep":
					code += ["window.location = '/current/", taskexecuuid, "';"].join('');
					break;

			}

		}

	}

	// html += ['$("body").spinstop("modal");'].join('');

	for (var i = 0; i < timeoutcount; i++)
		code += timeoutend;

	code += '});';
	code += '</script>';

	console.log('CODE:', code);

	return html + code;

};

module.exports = Step;