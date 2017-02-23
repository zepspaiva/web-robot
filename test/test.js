var Q = require('q');
var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require("body-parser");
var session = require('express-session');

var WebRobot = require('../index.js');

var app = express();
var port = 3003;

var tasksfolderpath = 'mapping/tasks';
var mapsfolderpath = 'mapping/maps';

function main() {

	var webrobot = new WebRobot(tasksfolderpath, null, true);

	app.use(function(req, res, next) {
		req.rawBody = '';
		req.setEncoding('utf8');
		req.on('data', function(chunk) {
			req.rawBody += chunk;
		});
		req.on('end', function() {
			next();
		});
	});

	app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));

	app.get('/', function(req, res) {

		return webrobot.listTasks()
		.then(function(tasks) {

			var html = '';

			tasks.sort(function(t1, t2) {
				return t1.name > t2.name;
			});

			return tasks.reduce(function(p, task) {
				return p.then(function() {
					html += ["<a href='./run/", task.id ,"'>", task.name, "</a><br/>"].join('');
				});
			}, Q())
			.then(function() {
				res.status(200).send(html);
			})
			.catch(function(err) {
				console.log(err.stack);
				res.status(404).send(err.message);
			});

		});

	});

	app.get('/run/:taskid', function(req, res) {

		var taskid = req.params.taskid;
		var data = {"sicaq_cadastro_pis": "", "sicaq_renda_formal_cmbComprovanteRenda":"CONTRACHEQUE/HOLLERITH","sicaq_login_convenio":"000597660","sicaq_login_login":"vanessa","sicaq_login_password":"H0melend","sicaq_cadastro_cpf":"869.121.605-06","sicaq_identificacao_nomePai":"LUIZ EDUARDO MENEZES BRUNO","sicaq_cadastro_cmbNacionalidade":"","sicaq_cadastro_cmbTipoDocumento":"DOCUMENTO DE IDENTIFICAÇÃO","sicaq_cadastro_subTipoIdentidadeNumeroRg":"DOCUMENTO DE IDENTIFICAÇÃO","sicaq_identificacao_identidadeNumeroCnh":"","sicaq_cadastro_identidadeNumeroCnh":"","sicaq_cadastro_cmbOrgaoEmissorCnh":"ÓRGÃO DE TRÂNSITO","sicaq_cadastro_cmbUFIdentidadeCnh":"BA","sicaq_cadastro_dataPrimeiraHabilitacaoCnh":"","sicaq_cadastro_dataEmissaoIdentidadeCnh":"01/01/2000","sicaq_cadastro_dataFimValidadeCnh":"","sicaq_cadastro_cmbEstadoCivil":"","sicaq_cadastro_cpfConjuge":"00113691831","sicaq_cadastro_cmbTpOcupacao":"FORMAL","sicaq_cadastro_emprestimosFinanciamentos":true,"sicaq_cadastro_nomeReduzido":"GUILHERME PORTO BRUNO","sicaq_cadastro_dataNascimento":"02/04/1975","sicaq_cadastro_cmbSexo":"Masculino","sicaq_cadastro_cmbUFNaturalidade":"SP","sicaq_cadastro_cmbMunicipioNaturalidade":"SAO BERNARDO DO CAMPO","sicaq_cadastro_nomePai":"LUIZ EDUARDO MENEZES BRUNO","sicaq_cadastro_nomeMae":"MARILIA ESPINHEIRA PORTO BRUNO","sicaq_cadastro_cmbGrauInstrucao":"SUPERIOR COMPLETO","sicaq_identificacao_identidadeNumeroRg":"515066290","sicaq_cadastro_identidadeNumeroRg":"515066290","sicaq_cadastro_cmbOrgaoEmissorRg":"SECRETARIA DE SEGURANÇA PÚBLICA","sicaq_cadastro_cmbUFIdentidadeRg":"BA","sicaq_cadastro_dataEmissaoIdentidadeRg":"01/01/2000","sicaq_cadastro_dataFimValidadeRg":"","sicaq_cadastro_cmbOcupacaoFormal":"PROPRIETARIO DE ESTABELECIMENTO COMERCIAL","sicaq_endereco_cep":"01443000","sicaq_endereco_complemento":"","sicaq_endereco_numero":"540","sicaq_endereco_cmbTipoImovel":"CASA","sicaq_endereco_cmbTipoOcupacaoImovel":"PRÓPRIA QUITADA","sicaq_endereco_comprovanteResidenciaMes":"02","sicaq_endereco_comprovanteResidenciaAno":"2017","sicaq_endereco_dddRes":"11","sicaq_endereco_telefoneRes":"30850076","sicaq_endereco_dddCel":"11","sicaq_endereco_telefoneCel":"999095305","sicaq_endereco_email":"PEDLUIZA@GMAIL.COM","sicaq_agencia_relacionamento_cmbUFAgenciaRelacionamento":"BA","sicaq_agencia_relacionamento_cmbMunicipioAgenciaRelacionamento":"SALVADOR","sicaq_agencia_relacionamento_cmbAgenciaRelacionamento":"1053 ITAPUA, BA","sicaq_renda_formal_cmbCaracteristicaRenda":"COMPROVADA","sicaq_renda_formal_cmbCnpj_cpf":"JURÍDICA","sicaq_renda_formal_numeroCnpj":"61.023.156/0003-44","sicaq_renda_formal_cmbOcupacao":"PROPRIETARIO DE ESTABELECIMENTO COMERCIAL","sicaq_renda_formal_dataAdmissao":"01/01/2001","sicaq_renda_formal_iImposRendaRetFonte":"350,00","sicaq_renda_formal_valorRendaBruta":"5.100,00","sicaq_renda_formal_valorRendaLiquida":"4.200,00","sicaq_renda_formal_dtRefCompr":"02/2017"};

		return webrobot.createTaskExecution(taskid, data)
		.then(function(taskexecuuid) {

			res.redirect(['/next/', taskexecuuid].join(''));

		})
		.catch(function(err) {
			console.log(err.stack);
			res.status(404).send(err.message);
		});

	});

	webrobot.setupRoutes(app);

	app.listen(port, function () {

		console.log('Listening on port', port);

	});

}

main();