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
		//var data = JSON.parse(fs.readFileSync(path.join(mapsfolderpath, taskid.replace(/\.task$/, '') + '.map.json')));

		var data = {"sicaq_login_convenio":"000597660","sicaq_login_login":"vanessa","sicaq_login_password":"H0melend","sicaq_cadastro_cpf":"869.121.605-06","sicaq_identificacao_nomePai":"LUIZ EDUARDO MENEZES BRUNO","sicaq_cadastro_cmbNacionalidade":"BRASILEIRO","sicaq_cadastro_cmbTipoDocumento":"CARTEIRA NACIONAL DE HABILITAÇÃO","sicaq_cadastro_subTipoIdentidadeNumeroRg":"CARTEIRA NACIONAL DE HABILITAÇÃO","sicaq_identificacao_identidadeNumeroCnh":"02339429309","sicaq_cadastro_identidadeNumeroCnh":"02339429309","sicaq_cadastro_cmbOrgaoEmissorCnh":"ÓRGÃO DE TRÂNSITO","sicaq_cadastro_cmbUFIdentidadeCnh":"SP","sicaq_cadastro_dataPrimeiraHabilitacaoCnh":"04/05/1993","sicaq_cadastro_dataEmissaoIdentidadeCnh":"18/10/2013","sicaq_cadastro_dataFimValidadeCnh":"04/10/2018","sicaq_cadastro_cmbEstadoCivil":"CASADO (A) COM COMUNHÃO PARCIAL DE BENS","sicaq_cadastro_cpfConjuge":"94224455587","sicaq_cadastro_cmbTpOcupacao":"FORMAL","sicaq_cadastro_emprestimosFinanciamentos":true,"sicaq_cadastro_nomeReduzido":"GUILHERME BRUNO","sicaq_cadastro_dataNascimento":"02/04/1975","sicaq_cadastro_cmbSexo":"Masculino","sicaq_cadastro_cmbUFNaturalidade":"BA","sicaq_cadastro_cmbMunicipioNaturalidade":"SALVADOR","sicaq_cadastro_nomePai":"LUIZ EDUARDO MENEZES BRUNO","sicaq_cadastro_nomeMae":"MARILIA ESPINHEIRA PORTO BRUNO","sicaq_cadastro_cmbGrauInstrucao":"SUPERIOR COMPLETO","sicaq_identificacao_identidadeNumeroRg":"","sicaq_cadastro_identidadeNumeroRg":"02339429309","sicaq_cadastro_cmbOrgaoEmissorRg":"SECRETARIA DE SEGURANÇA PÚBLICA","sicaq_cadastro_cmbUFIdentidadeRg":"SP","sicaq_cadastro_dataEmissaoIdentidadeRg":"18/10/2013","sicaq_cadastro_dataFimValidadeRg":"04/10/2018","sicaq_cadastro_cmbOcupacaoFormal":"ENGENHEIRO","sicaq_endereco_cep":"06473082","sicaq_endereco_complemento":"","sicaq_endereco_numero":"161","sicaq_endereco_cmbTipoImovel":"CASA","sicaq_endereco_cmbTipoOcupacaoImovel":"PRÓPRIA QUITADA","sicaq_endereco_comprovanteResidenciaMes":"12","sicaq_endereco_comprovanteResidenciaAno":"2016","sicaq_endereco_dddRes":"11","sicaq_endereco_telefoneRes":"38471977","sicaq_endereco_dddCel":"11","sicaq_endereco_telefoneCel":"963939070","sicaq_endereco_email":"","sicaq_agencia_relacionamento_cmbUFAgenciaRelacionamento":"BA","sicaq_agencia_relacionamento_cmbMunicipioAgenciaRelacionamento":"SALVADOR","sicaq_agencia_relacionamento_cmbAgenciaRelacionamento":"123 AgenciaTeste","sicaq_renda_formal_cmbCaracteristicaRenda":"COMPROVADA","sicaq_renda_formal_cmbCnpj_cpf":"JURÍDICA","sicaq_renda_formal_numeroCnpj":"07.416.887/0001-42","sicaq_renda_formal_cmbOcupacao":"ENGENHEIRO","sicaq_renda_formal_dataAdmissao":"01/01/2001","sicaq_renda_formal_iImposRendaRetFonte":"0,00","sicaq_renda_formal_valorRendaBruta":"15.000,00","sicaq_renda_formal_valorRendaLiquida":"999,99","sicaq_renda_formal_cmbComprovanteRenda":"DECLARAÇÃO DE IMPOSTO DE RENDA","sicaq_renda_formal_dtRefCompr":"12/2016"};

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