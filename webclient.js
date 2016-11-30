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
	
};

var Transform = require('stream').Transform;

var TransformStream = function(options) {
	options = options || {};
	options.objectMode = true;
	Transform.call(this, options);
	this.data = '';
	this.filedata = new Stream();
};

util.inherits(TransformStream, Transform);
 
TransformStream.prototype._transform = function(chunk, encoding, callback) {
	
	this.data += iconv.decode(chunk, 'iso-8859-1');
	this.filedata.push(chunk);
	callback();

};

WebClient.prototype._createPostRequest = function(url, jar, postdata, headers) {

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
		if (error) return console.log('POST REQ ERROR', error);
	});

};

WebClient.prototype._createGetRequest = function(url, jar, headers) {

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
		if (error) return console.log('GET REQ ERROR', error);
	});

};

WebClient.prototype._createRequest = function(url, jar, method, postdata, headers) {

	var self = this;

	switch (method) {

		case 'POST':
			return self._createPostRequest(url, jar, postdata, headers);

		default:
			return self._createGetRequest(url, jar, headers);

	}

};

WebClient.prototype.runRequest = function(taskexec, method, req, res, rurl) {

	var self = this;
	var baseurl = self.task.baseurl;

	var newurl = [baseurl, rurl].join('');

	var step = taskexec.curStep();

	self._createRequest(newurl, self.jar, method, req.rawBody, req.headers)
	.on('response', function(response) {

		var ts = new TransformStream();

		// Response status code is not 200...
		if (response.statusCode != 200)
			return response.pipe(res);
	
		else if (response.headers['content-type'].indexOf('application/pdf') != -1)
			return response
			.pipe(ts)
			.on('finish', function() {
				ts.end();
				taskexec.trigger('newpdffile', ts.filedata);
				console.log('Redirecting client to', self.task.pdfurl);
				return res.redirect([self.task.pdfurl, '?uuid=', taskexec.uuid].join(''));
			});

		// If it's not HTML, javascript or PDF, act as a proxy;
		else if (response.headers['content-type'].indexOf('text/html') == -1 &&
			 	 response.headers['content-type'].indexOf('application/pdf') == -1 &&
			 	 response.headers['content-type'].indexOf('javascript') == -1)
			return response.pipe(res);

		// If it's javscript change code so there are no alerts or confirmations...
		else if (response.headers['content-type'].indexOf('javascript') != -1) {
			return response
				.pipe(ts)
				.on('finish', function() {
					ts.end();
					var js = ts.data.toString().replace(/alert\(/gi, 'console.log(').replace(/confirm\(.*\)/gi, 'true');
					return res.send(js);
				});
		}

		// Ignore page if there's no current step or if the urls don't match..
		if (!step || (step.url && step.url != rurl)) {
			console.log('URL unexpected:', rurl);
			console.log('Eexpected URL:', step.url);
		}
		// 	return response.pipe(ts).on('finish', function () { return res.send(ts.data.toString()); });

		res.setHeader('content-type', response.headers['content-type']);

		response
		.pipe(ts)
		.on('finish', function() {

			ts.end();
			var html = ts.data.toString().replace(/alert\(/gi, 'console.log(').replace(/confirm\([^\)]*\)/gi, 'true');

			// Skip not recognized steps...
			while (step && !step.recognize(html)) {
				console.log('Skiping step', step.name);
				step = taskexec.nextStep();
				if (step) console.log('Going to next step:', step.name);
			}

			// Ignore page if it's not recognized by any of the next steps...
			if (!step) {
				console.log('No more steps...');
				return response.pipe(ts).on('finish', function () { return res.send(ts.data.toString()); });
			}

			// Inject step code...
			html = step.injectCode(html, taskexec.uuid);

			// Go to next step...
			step = taskexec.nextStep();
			if (step) console.log('Going to next step:', step.name);

			// Send injected HTML to client;
			return res.send(html);

		});

	});

};

module.exports = WebClient;