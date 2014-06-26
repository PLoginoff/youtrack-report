var express = require('express');
var path = require('path');
var http = require('http');
var mongoose = require('mongoose');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require('./config');
var routes = require('./routes');

// passport config
var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.methodOverride());
app.use(cookieParser(config.SECRET));
app.use(flash());
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

function ensureAuthenticated(req, res, next) {
    if (req.user) { return next(); }
    res.redirect('/login')
}

// mongoose
mongoose.connect('mongodb://localhost/passport_local_mongoose');

// Routes

app.get('/login', routes.login);
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), routes.loginSuccess);
app.get('/logout', routes.logout);

// Protected routs
app.get('/', ensureAuthenticated, routes.index);
app.get('/report/1', ensureAuthenticated, routes.report1);
app.post('/report/1', ensureAuthenticated, routes.genReport1);
app.get('/report/2', ensureAuthenticated, routes.report2);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;