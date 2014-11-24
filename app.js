var express = require('express');
var path = require('path');
var http = require('http');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('express-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var config = require('./config');
var routes = require('./routes');
var users = config.USERS;

// passport config
passport.use(new LocalStrategy(
  function(username, password, done) {
    var isValid = users.some(function (user) {
      return user.username === username && user.password === password;
    });

    if (!isValid) {
      return done(null, false);
    }

    return done(null, {username: username});
  }
));
passport.serializeUser(function (user, done) {
  done(null, user.username);
});
passport.deserializeUser(function (username, done) {
  users.forEach(function (user) {
    if (user.username === username) {
      done(null, user);
    }
  });
});

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
    res.redirect('/login');
}

// Routes

app.get('/login', routes.login);
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
      res.redirect('/');
    });
app.get('/logout', routes.logout);

// Protected routs
app.get('/', ensureAuthenticated, routes.index);
app.get('/report/1', ensureAuthenticated, routes.report1);
app.post('/report/1', ensureAuthenticated, routes.genReport1);
app.get('/report/2', ensureAuthenticated, routes.report2);
app.post('/report/2', ensureAuthenticated, routes.genReport2);
app.get('/report/3', ensureAuthenticated, routes.report3);
app.post('/report/3', ensureAuthenticated, routes.genReport3);

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
