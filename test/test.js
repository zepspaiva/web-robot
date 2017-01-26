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
		var data = {"sicaq_renda_formal_cmbComprovanteRenda":"","sicaq_login_convenio":"000597660","sicaq_login_login":"vanessa","sicaq_login_password":"H0melend","sicaq_cadastro_cpf":"359.369.308-90","sicaq_identificacao_nomePai":"MANOEL LOPES DE OLIVEIRA","sicaq_cadastro_cmbNacionalidade":"BRASILEIRO","sicaq_cadastro_cmbTipoDocumento":"CARTEIRA NACIONAL DE HABILITAÇÃO","sicaq_cadastro_subTipoIdentidadeNumeroRg":"CARTEIRA NACIONAL DE HABILITAÇÃO","sicaq_identificacao_identidadeNumeroCnh":"42972532","sicaq_cadastro_identidadeNumeroCnh":"42972532","sicaq_cadastro_cmbOrgaoEmissorCnh":"ÓRGÃO DE TRÂNSITO","sicaq_cadastro_cmbUFIdentidadeCnh":"SP","sicaq_cadastro_dataPrimeiraHabilitacaoCnh":"03/10/2006","sicaq_cadastro_dataEmissaoIdentidadeCnh":"27/10/2011","sicaq_cadastro_dataFimValidadeCnh":"27/11/2019","sicaq_cadastro_cmbEstadoCivil":"CASADO (A) COM COMUNHÃO PARCIAL DE BENS","sicaq_cadastro_cpfConjuge":"01632054698","sicaq_cadastro_cmbTpOcupacao":"FORMAL","sicaq_cadastro_emprestimosFinanciamentos":true,"sicaq_cadastro_nomeReduzido":"ALBERT OLIVEIRA","sicaq_cadastro_dataNascimento":"27/10/1987","sicaq_cadastro_cmbSexo":"Masculino","sicaq_cadastro_cmbUFNaturalidade":"PB","sicaq_cadastro_cmbMunicipioNaturalidade":"SOUSA","sicaq_cadastro_nomePai":"MANOEL LOPES DE OLIVEIRA","sicaq_cadastro_nomeMae":"ANTONIA MARIA DE OLIVEIRA LOPES","sicaq_cadastro_cmbGrauInstrucao":"SUPERIOR COMPLETO","sicaq_identificacao_identidadeNumeroRg":"","sicaq_cadastro_identidadeNumeroRg":"42972532","sicaq_cadastro_cmbOrgaoEmissorRg":"SECRETARIA DE SEGURANÇA PÚBLICA","sicaq_cadastro_cmbUFIdentidadeRg":"SP","sicaq_cadastro_dataEmissaoIdentidadeRg":"27/10/2011","sicaq_cadastro_dataFimValidadeRg":"27/11/2019","sicaq_cadastro_cmbOcupacaoFormal":"ENGENHEIRO","sicaq_endereco_cep":"09850110","sicaq_endereco_complemento":"bloco 01 apto 32","sicaq_endereco_numero":"201","sicaq_endereco_cmbTipoImovel":"APARTAMENTO","sicaq_endereco_cmbTipoOcupacaoImovel":"ALUGADA","sicaq_endereco_comprovanteResidenciaMes":"01","sicaq_endereco_comprovanteResidenciaAno":"2017","sicaq_endereco_dddRes":"11","sicaq_endereco_telefoneRes":"45767131","sicaq_endereco_dddCel":"11","sicaq_endereco_telefoneCel":"954767374","sicaq_endereco_email":"LOPES.OLIVEIRA.ALBERT@GMAIL.COM","sicaq_agencia_relacionamento_cmbUFAgenciaRelacionamento":"SP","sicaq_agencia_relacionamento_cmbMunicipioAgenciaRelacionamento":"BARUERI","sicaq_agencia_relacionamento_cmbAgenciaRelacionamento":"1969 ALPHAVILLE, SP","sicaq_renda_formal_cmbCaracteristicaRenda":"COMPROVADA","sicaq_renda_formal_cmbCnpj_cpf":"JURÍDICA","sicaq_renda_formal_numeroCnpj":"59.104.901/0001-76","sicaq_renda_formal_cmbOcupacao":"ENGENHEIRO","sicaq_renda_formal_dataAdmissao":"12/12/2011","sicaq_renda_formal_iImposRendaRetFonte":"859,03","sicaq_renda_formal_valorRendaBruta":"10.737,86","sicaq_renda_formal_valorRendaLiquida":"7.728,97","sicaq_renda_formal_dtRefCompr":"01/2017"};

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