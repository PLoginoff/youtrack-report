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
        .then(helpers.getProjectIds)
        .then(client.getProjectList.bind(client))
        .then(helpers.formatProjectList)
        .then(function (projects) {
            res.render('report1', {
                title: 'Отчет по проектам',
                projects: projects}
            );
        })
        .otherwise(function (err) {
            req.flash('error', err);
            res.render('report1');
        });
};

exports.genReport1 = function (req, res) {
    var data = {
            PROJECT_NAME: req.body.project,
            GEN_DATE: moment().format('DD/MM/YYYY'),
            PROJECT_LEAD: '',
            issues: [],
            assigneePositions: []
        };

    // || !req.body.email.join('').trim()
    if (!req.body.project) {
        req.flash('error', 'Не заполнены обязательные поля, отмеченные звездочкой');
        res.redirect('report/1');
    }

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

    function handleSuccess(result) {
        var report;

        data.PROJECT_LEAD = result[0];
        data.issues = result[1];
        data.assigneePositions = helpers.getUsernamePositionHash(result[2]);
        report = excel.execute(getConf(data));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "Report by project.xlsx");
        res.end(report, 'binary');
    }

    function handleFailure(err) {
        console.log(err);
        req.flash('error', err);
        res.redirect('/report/1');
    }

    var client = new YouTrackClient(config.YOUTRACK_HOST);

    var loggedInPromise = when(client.login(config.YOUTRACK_USER, config.YOUTRACK_PASSWORD));

    var projectLeadFullNamePromise = loggedInPromise
            .then(client.getProject.bind(client, req.body.project))
            .then(helpers.getProjectLeadUsername)
            .then(client.getUser)
            .then(helpers.getUserFullName);

    var projectIssuesPromise = when.try(
            helpers.getIssuesFilteredByDate,
            loggedInPromise.then(client.getAllProjectIssues.bind(client, req.body.project)),
            req.body.since,
            req.body.till
        );

    var projectAssigneePositionsPromise = projectIssuesPromise
            .then(helpers.getProjectIssuesUsers)
            .then(function (usernames) { return when.join(usernames, when.map(usernames, client.getUserGroups)); })
            .then(function (usersInfo) { return when.join(usersInfo[0], when.map(usersInfo[1], helpers.getUserPosition)); });

    when.join(
            projectLeadFullNamePromise,
            projectIssuesPromise,
            projectAssigneePositionsPromise
        )
        .then(handleSuccess)
        .otherwise(handleFailure);
};

exports.report2 = function(req, res){
    var client = new YouTrackClient(config.YOUTRACK_HOST);

    var loggedInPromise = when(client.login(config.YOUTRACK_USER, config.YOUTRACK_PASSWORD));

    var projectListPromise = loggedInPromise
            .then(client.getAllProjects)
            .then(helpers.getProjectIds)
            .then(client.getProjectList.bind(client))
            .then(helpers.formatProjectList);

    var userListPromise = loggedInPromise
            .then(client.getAllUsers.bind(client))
            .then(function (users) { return when.map(users, helpers.getUserLogin); })
            .then(function (usernames) { return when.map(usernames, client.getUser); })
            .then(function (users) { return when.map(users, helpers.getUserLoginFullNameHash); });

    when.join(
            projectListPromise,
            userListPromise
        )
        .then(function (result) {
            console.log(result);
            res.render('report2', {
                title: 'Отчет по времени',
                projects: result[0],
                users: result[1],
                since: moment().day(-1).format('DD.MM.YYYY'),
                till: moment().format('DD.MM.YYYY')
            });
        })
        .otherwise(function (err) {
            console.log(err);
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