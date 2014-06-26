var mongoose = require('mongoose');
var Account = require('./../models/account');

var username;
var password;
var account;

process.argv.forEach(function(val, index, array) {
    if (val.indexOf('username=') != -1) {
        username = val.match(/\w+=(.+)/);
        username = username ? username[1] : null;
    }
    if (val.indexOf('password=') != -1) {
        password = val.match(/\w+=(.+)/);
        password = password ? password[1] : null;
    }
});

if (username && password) {
    console.log('Creating user "%s" with password "%s"...', username, password);

    mongoose.connect('mongodb://localhost/passport_local_mongoose');
    Account.register(new Account({ username: username }), password, function(err, account) {
        if (err) {
            console.log('Error: ' + err);
        } else {
            console.log('User "%s" created!', username);
        }
        process.exit();
    });
} else {
    console.log('Error: missing parameters. Specify username and password in this format: username=username password=password');
}