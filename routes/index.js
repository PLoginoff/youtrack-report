var session = require('session');
var flash = require('express-flash');
var YouTrackClient = require('./../utils/youtrack');
var config = require('./../config');
var when = require('when');
var excel = require('excel-export');
var moment = require('moment');
var getConf = require('./../utils/report1/get_config');
var helpers = require('./../utils/helpers');
var nodemailer = require('nodemailer');

exports.index = function(req, res){
    res.render('index', { title: 'Ahoy!' });
};

exports.login = function(req, res){
    res.render('login', { title: 'Войти' });
};

exports.logout = function(req, res){
    req.logout();
    res.redirect('/login');
};

exports.loginFailure = function(req, res){
    req.flash('error', 'Invalid credentials');
    res.redirect('/login');
};

exports.loginSuccess = function(req, res){
    res.redirect('/');
};

/* Reports */

exports.report1 = function(req, res){
    var client = new YouTrackClient(config.YOUTRACK_HOST);

    when(client.login(config.YOUTRACK_USER, config.YOUTRACK_PASSWORD))
        .then(client.getAllProjects)
        .then(when.lift(helpers.getProjectIds))
        .then(client.getProjectList.bind(client))
        .then(when.lift(helpers.formatProjectList))
        .then(function (projects) {
            res.render('report1', { title: 'Отчет по проектам', projects: projects});
        })
        .otherwise(function (err) {
            req.flash('error', err);
            res.render('report1');
        });
};

exports.genReport1 = function (req, res) {
    var client = new YouTrackClient(config.YOUTRACK_HOST),
        data = {
            PROJECT_NAME: req.body.project,
            GEN_DATE: moment().format('DD/MM/YYYY'),
            PROJECT_LEAD: '',
            issues: []
        };

    // || !req.body.email.join('').trim()
    if (!req.body.project) {
        req.flash('error', 'Не заполнены обязательные поля, отмеченные звездочкой');
        res.redirect('report/1');
    }

    function streamExcelToBrowser(issues) {
        var result, conf;

//        console.log(issues);

        data.issues = issues;
        conf = getConf(data);
        result = excel.execute(conf);
/**
        // Send email if there are some emails
        if (req.body.email.length > 0) {
            var smtpTransport = nodemailer.createTransport("SMTP",{
                service: "Gmail",
                auth: {
                    user: config.MAIL_USER,
                    pass: config.MAIL_PASSWORD
                }
            });

            var mailOptions = {
                from: "Robot  <" + config.MAIL_USER + ">", // sender address
                to: req.body.email.join(', '),
                subject: "Отчет по проектам",
                text: "Отчет был сгенерирован автоматически"
            };

            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log(error);
                }else{
                    console.log("Message sent: " + response.message);
                }

                // if you don't want to use this transport object anymore, uncomment following line
                //smtpTransport.close(); // shut down the connection pool, no more messages
            });
        }
**/
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Report by project.xlsx");
        res.end(result, 'binary');
    }

    var whenLoggedIn = when(client.login(config.YOUTRACK_USER, config.YOUTRACK_PASSWORD));
    var issues;
    var userPositions;

    whenLoggedIn
        .then(client.getProject.bind(client, req.body.project))
        .then(when.lift(helpers.getProjectLeadUsername))
        .then(client.getUser)
        .then(when.lift(helpers.getUserFullName))
        .then(when.lift(function (projectLeadFullName) { return data.PROJECT_LEAD = projectLeadFullName; }))
        .then(when.try(
                helpers.getIssuesFilteredByDate,
                whenLoggedIn.then(client.getAllProjectIssues.bind(client, req.body.project)),
                req.body.since,
                req.body.till
            )

//
//            .then(when.lift(helpers.getProjectIssuesUsers))
//            .then(when.lift(function (users) { return when.map(users, client.getUserGroups); }))
//            .then(when.list(function (userGroups) { return when.map(userGroups, helpers.getUserPosition); }))


            .then(streamExcelToBrowser)
        )
        .otherwise(function (err) {
            console.log(err);
            req.flash('error', err);
            res.redirect('/report/1');
        });
};

exports.report2 = function(req, res){
    var client = new YouTrackClient(config.YOUTRACK_HOST);

    var whenLoggedIn = when(client.login(config.YOUTRACK_USER, config.YOUTRACK_PASSWORD));

    when.join(
        whenLoggedIn
            .then(when.lift(client.getAllProjects))
            .then(when.lift(helpers.getProjectIds))
            .then(client.getProjectList.bind(client))
            .then(when.lift(helpers.formatProjectList))
    )
    .then(function (result) {
        console.log(result);
        res.render('report2', {
            title: 'Отчет по времени',
            projects: result[0],
            since: moment().day(-1).format('DD.MM.YYYY'),
            till: moment().format('DD.MM.YYYY')
        });
    })
    .otherwise(function (err) {
        req.flash('error', err);
        res.render('report2');
    });
};

exports.genReport2 = function (req, res) {
    if (!req.body.project.trim() || !req.body.user.trim() || !req.body.since.trim() || !req.body.till.trim()) {
        req.flash('error', 'Не заполнены обязательные поля, отмеченные звездочкой *');
        res.redirect('report/2');
    }
};