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

		var data = {"sicaq_login_convenio":"000597660","sicaq_login_login":"vanessa","sicaq_login_password":"H0melend","sicaq_cadastro_cpf":"304.854.298-10","sicaq_identificacao_nomePai":"ANTONIO ARCELINO SANTOS","sicaq_identificacao_identidadeNumeroRg":"29.979.049-6","sicaq_cadastro_cmbNacionalidade":"BRASILEIRO","sicaq_cadastro_cmbTipoDocumento":"DOCUMENTO DE IDENTIFICAÇÃO","sicaq_cadastro_subTipoIdentidadeNumeroRg":"DOCUMENTO DE IDENTIFICAÇÃO","sicaq_cadastro_cmbEstadoCivil":"CASADO (A) COM COMUNHÃO PARCIAL DE BENS","sicaq_cadastro_cpfConjuge":"34160096816","sicaq_cadastro_cmbTpOcupacao":"FORMAL","sicaq_cadastro_emprestimosFinanciamentos":true,"sicaq_cadastro_nomeReduzido":"ADRIANO SANTOS","sicaq_cadastro_dataNascimento":"23/04/1982","sicaq_cadastro_cmbSexo":"Masculino","sicaq_cadastro_cmbUFNaturalidade":"SP","sicaq_cadastro_cmbMunicipioNaturalidade":"SAO PAULO","sicaq_cadastro_nomePai":"ANTONIO ARCELINO SANTOS","sicaq_cadastro_nomeMae":"NAIR DA SILVA SANTOS","sicaq_cadastro_cmbGrauInstrucao":"SUPERIOR COMPLETO","sicaq_cadastro_identidadeNumeroRg":"29.979.049-6","sicaq_cadastro_cmbOrgaoEmissorRg":"SECRETARIA DE SEGURANÇA PÚBLICA","sicaq_cadastro_cmbUFIdentidadeRg":"SP","sicaq_cadastro_dataEmissaoIdentidadeRg":"05/01/2011","sicaq_cadastro_dataFimValidadeRg":"","sicaq_cadastro_cmbOcupacaoFormal":"TECNICO DE CONTABILIDADE E DE ESTATISTICA","sicaq_endereco_cep":"09781250","sicaq_endereco_complemento":"APTO 146 BL 3","sicaq_endereco_numero":"151","sicaq_endereco_cmbTipoImovel":"APARTAMENTO","sicaq_endereco_cmbTipoOcupacaoImovel":"MORA COM PAIS/PARENTES","sicaq_endereco_comprovanteResidenciaMes":"10","sicaq_endereco_comprovanteResidenciaAno":"2016","sicaq_endereco_dddRes":"11","sicaq_endereco_telefoneRes":"23811389","sicaq_endereco_dddCel":"11","sicaq_endereco_telefoneCel":"996932476","sicaq_endereco_email":"MICHELLE@CONTAGE.COM.BR","sicaq_agencia_relacionamento_cmbUFAgenciaRelacionamento":"SP","sicaq_agencia_relacionamento_cmbMunicipioAgenciaRelacionamento":"SAO PAULO","sicaq_agencia_relacionamento_cmbAgenciaRelacionamento":"0244 CASA VERDE, SP","sicaq_renda_formal_cmbCaracteristicaRenda":"COMPROVADA","sicaq_renda_formal_cmbCnpj_cpf":"JURÍDICA","sicaq_renda_formal_numeroCnpj":"59.104.901/0001-76","sicaq_renda_formal_cmbOcupacao":"TECNICO DE CONTABILIDADE E DE ESTATISTICA","sicaq_renda_formal_dataAdmissao":"16/08/2010","sicaq_renda_formal_iImposRendaRetFonte":"188,51","sicaq_renda_formal_valorRendaBruta":"4.070,51","sicaq_renda_formal_valorRendaLiquida":"1.143,99","sicaq_renda_formal_cmbComprovanteRenda":"DECLARAÇÃO DE IMPOSTO DE RENDA","sicaq_renda_formal_dtRefCompr":"10/2016"};

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