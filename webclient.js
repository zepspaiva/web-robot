var Q = require('q');
var path = require('path');
var fs = require('fs');
var util = require('util');
var request = require('request');
var iconv = require('iconv-lite');
var Stream = require('stream').Transform;

var DEBUG = false;

function WebClient(task, jar) {

	this.task = task;
	this.jar = jar;

	this.cache = {};
	this.cacheable = /\.css$|\.js$|\.jpg$|\.png|\.gif$/ 
	
};

var Transform = require('stream').Transform;

var TransformStream = function(options) {
	options = options || {};
	options.objectMode = true;
	Transform.call(this, options);
	this.data = '';
	this.filedata = [];
};

util.inherits(TransformStream, Transform);
 
TransformStream.prototype._transform = function(chunk, encoding, callback) {
	
	this.data += iconv.decode(chunk, 'iso-8859-1');
	this.filedata.push(chunk);
	callback();

};

WebClient.prototype._createPostRequest = function(taskexec, url, jar, postdata, headers) {

	if (DEBUG) console.log('POST', url, postdata);

	var options = {
		url: url,
		//proxy: 'http://localhost:8000/',
		method: 'POST',
		headers: {
			'user-agent': 'request'
		},
		jar: jar,
		rejectUnauthorized: false,
		body: postdata
	};

	for (h in headers)
		if (['content-type', 'user-agent'].indexOf(h.toLowerCase()) > -1)
			options.headers[h] = headers[h];

	if (DEBUG) console.log('POST', url, postdata, options.headers);

	return request(options, function (error, response, body) {
		if (error) {
			console.log('POST REQ ERROR', error);
			taskexec.trigger('error', error.code);
		}
	});

};

WebClient.prototype._createGetRequest = function(taskexec, url, jar, headers) {

	if (DEBUG) console.log('GET', url);

	var options = {
		url: url,
		method: 'GET',
		//proxy: 'http://localhost:8000/',
		headers: {
     		'User-Agent': 'request'
		},
		jar: jar,
		rejectUnauthorized: false
	};

	if (headers && headers['content-type'])
		options.headers['content-type'] = headers['content-type'];

	if (DEBUG) console.log('GET', url, options.headers);

	return request(options, function (error, response, body) {
		if (error) {
			console.log('GET REQ ERROR', error);
			taskexec.trigger('error', error.code);
		}
	});

};

WebClient.prototype._createRequest = function(taskexec, url, jar, method, postdata, headers) {

	var self = this;

	switch (method) {

		case 'POST':
			return self._createPostRequest(taskexec, url, jar, postdata, headers);

		default:
			return self._createGetRequest(taskexec, url, jar, headers);

	}

};

WebClient.prototype.runRequest = function(taskexec, method, req, res, rurl) {

	var self = this;
	var baseurl = self.task.baseurl;

	var newurl = [baseurl, rurl].join('');

	var step = taskexec.curStep();

	console.log('>', req.url);

	if (self.cacheable.test(req.url) && req.url in self.cache) {
		console.log('Using cache', req.url);
		return res.status(200).send(self.cache[req.url]);
	}

	self._createRequest(taskexec, newurl, self.jar, method, req.rawBody, req.headers)
	.on('response', function(response) {

		console.log(response.headers['content-type']);

		var ts = new TransformStream();

		// Response status code is not 200...
		if (response.statusCode != 200)
			return response.pipe(res);
	
		else if (response.headers['content-type'].indexOf('application/pdf') != -1)
			return response
			.pipe(ts)
			.on('finish', function() {
				ts.end();

				var filebuffer = Buffer.concat(ts.filedata);
				taskexec.trigger('newpdffile', filebuffer);

				console.log('Redirecting client to', self.task.pdfurl);
				return res.redirect([self.task.pdfurl, '?uuid=', taskexec.uuid].join(''));
			});

		else if (response.headers['content-type'].indexOf('application/json') != -1)
			return response.pipe(res);
		

		// If it's not HTML, javascript or PDF, act as a proxy;
		// else if (response.headers['content-type'].indexOf('text/html') == -1 &&
		// 	 	 response.headers['content-type'].indexOf('application/pdf') == -1// &&
		// 	 	 //response.headers['content-type'].indexOf('javascript') == -1// &&
		// 	 	 //response.headers['content-type'].indexOf('text/css') == -1 &&
		// 	 	 //response.headers['content-type'].indexOf('image/png') == -1
		// 	 	 ) {

		// 	if (!self.cacheable.test(req.url))
		// 		return response.pipe(res);

		// 	console.log('Will cache', req.url);

		// 	return response
		// 	.pipe(ts)
		// 	.on('finish', function() {
		// 		ts.end();
		// 		self.cache[req.url] = Buffer.concat(ts.filedata);
		// 		return res.send(self.cache[req.url]);
		// 	});

		// }
		
		// If it's javscript change code so there are no alerts or confirmations...
		else if (response.headers['content-type'].indexOf('javascript') != -1) {
			return response
				.pipe(ts)
				.on('finish', function() {
					ts.end();
					//.replace(/alert\(/gi, 'console.log(')
					var js = ts.data.toString().replace(/confirm\(.*\)/gi, 'true');
					return res.send(js);
				});
		}

		// Ignore page if there's no current step or if the urls don't match..
		if (!step || (step.url && step.url != rurl)) {
			console.log('TYPE/URL unexpected:', response.headers['content-type'], rurl);
			console.log('Expected URL:', step.url);
		}
		// 	return response.pipe(ts).on('finish', function () { return res.send(ts.data.toString()); });

		res.setHeader('content-type', response.headers['content-type']);

		response
		.pipe(ts)
		.on('finish', function() {

			ts.end();
			//.replace(/alert\(/gi, 'console.log(')
			var html = ts.data.toString().replace(/confirm\([^\)]*\)/gi, 'true');

			// Skip not recognized steps...
			while (step && !step.recognize(html)) {
				console.log('\x1b[31m%s\x1b[0m', 'Skiping step', step.name);
				step = taskexec.nextStep();
				if (step) console.log('Going to next step:', step.name);
			}

			// Ignore page if it's not recognized by any of the next steps...
			if (!step) {
				console.log('No more steps...');
				//return response.pipe(ts).on('finish', function () { return res.send(ts.data.toString()); });
				return res.send(html);
			}

			taskexec.trigger('newstep', step.name);

			try {

				// Inject step code...
				html = step.injectCode(html, taskexec.uuid);

			} catch (err) {
				taskexec.trigger('error', err.toString());
			}

			// Go to next step...

			if (!step.repeatUntilNotRecognized) {
				step = taskexec.nextStep();
				if (step) console.log('Going to next step:', step.name);
			}

			// Send injected HTML to client;
			return res.send(html);

		});

	});

};

module.exports = WebClient;