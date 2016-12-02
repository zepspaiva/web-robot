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
	self.prefix = prefix;

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

Step.prototype._levenshtein = function(str1, str2) {

	if (str1 == null && str2 == null) return 0;
	if (str1 == null) return String(str2).length;
	if (str2 == null) return String(str1).length;

	str1 = String(str1); str2 = String(str2);

	var current = [], prev, value;

	for (var i = 0; i <= str2.length; i++)
		for (var j = 0; j <= str1.length; j++) {
			if (i && j)
				if (str1.charAt(j - 1) === str2.charAt(i - 1))
	  				value = prev;
				else
	  				value = Math.min(current[j], current[j - 1], prev) + 1;
			else
				value = i + j;

			prev = current[j];
			current[j] = value;
		}

	return current.pop();

};

Step.prototype.injectCode = function(html, taskexecuuid) {

	var self = this;

	html += ['<script type="text/javascript" src="/', self.prefix, 'static/jquery-latest.min.js"></script>'].join('');
	html += ['<script type="text/javascript" src="/', self.prefix, 'static/spin.min.js"></script>'].join('');

	// html += ['<script type="text/javascript"> $("body").spin("modal","', self.name, '"); </script>'].join('');

	var timeoutbegin = 'setTimeout(function() {';
	var timeoutend = '}, 10);';
	var timeoutcount = 0;

	html += '<script type="text/javascript">';
	html += '$(window).on(\'load\', function() {';

	if (self.fields && self.fields.length) {

		for (f in self.fields) {

			var field = self.fields[f];
			
			var selector = field.type == 'select' ? 'select' : 'input';
			var selectorfields = ['id', 'name', 'type'];

			html += timeoutbegin;
			timeoutcount++;

			if (field.type == 'select') selectorfields = ['id', 'name'];

			for (s in selectorfields) {
				var sf = selectorfields[s];
				if (field[sf]) selector += ['[',sf,'="',field[sf],'"]'].join('');
			}

			if (field.type === 'radio' || field.type === 'checkbox') {

				if (field.checked || field.value == true)
					html += ['$(\'',selector, '\').prop(\'checked\', true);'].join('');

			} else if (field.value) {
				
				if (field.type == 'select') {

					var options = [];
					$(selector + ' option').each(function(a, b) {
						options.push({ text: b.text, value: b.value });
					});

					var validoption = null;
					var validoptiondist = 100000;

					for (var i = 0; i < options.length; i++) {
						var option = options[i];
						var dist = _levenshtein(option.text, field.value);

						console.log('calc dist', dist, validoptiondist);

						if (dist < validoptiondist) {
							validoption = option;
							validoptiondist = dist;
						}
					}

					console.log('validoption', validoption);
					
					if (validoption)
						html += ['$(\'',selector, '\').val(\'', validoption.value,'\')', field.trigger ? '.trigger(\'' + field.trigger + '\');' : ';'].join('');

				} else {
					
					html += ['$(\'',selector, '\').val(\'', field.value,'\')', field.trigger ? '.trigger(\'' + field.trigger + '\');' : ';'].join('');

				}

			}

		}

	}

	// Code to run actions...
	if (self.actions && self.actions.length) {

		for (a in self.actions) {

			var action = self.actions[a];

			html += timeoutbegin;
			timeoutcount++;

			if (action.code)
				html += action.code;

			switch (action.type) {

				case "nextstep":
					html += ["window.location = '/current/", taskexecuuid, "';"].join('');
					break;

			}

		}

	}

	// html += ['$("body").spinstop("modal");'].join('');

	for (var i = 0; i < timeoutcount; i++)
		html += timeoutend;

	html += '});';
	html += '</script>';

	return html;

};

module.exports = Step;