var when = require('when');
var rest = require('rest');
var defaultRequest = require('rest/interceptor/defaultRequest');
var pathPrefix = require('rest/interceptor/pathPrefix');
var parseString = require('xml2js').parseString;

// http client
var client = rest;

// helper function
handleXmlResponse = function (response) {
    var deferred = when.defer();

    parseString(response.entity, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(result);
        }
    });

    return deferred.promise;
};


// YouTrackClient

function YouTrackClient(hostname) {
    this.hostname = hostname;
}

YouTrackClient.prototype.authenticateClient = function (response) {
    var deferred = when.defer(),
        hostname = this.hostname;

    if (response.entity === '<login>ok</login>') {
        client = rest
            .wrap(pathPrefix, {prefix: hostname})
            .wrap(defaultRequest, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': response.headers['Set-Cookie'].join(', ')
                }
            });
        deferred.resolve();
    } else {
        deferred.reject(response);
    }

    return deferred.promise;
};

YouTrackClient.prototype.login = function (login, password) {
    var hostname = this.hostname;

    client = rest
        .wrap(pathPrefix, {prefix: hostname})
        .wrap(defaultRequest, {
            path: '/rest/user/login',
            method: 'POST',
            params: {
                login: login,
                password: password
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': 0
            }
        });

    return client().then(this.authenticateClient.bind(this));
};

YouTrackClient.prototype.getAllProjects = function () {
    return client('/rest/admin/project').then(handleXmlResponse);
};

YouTrackClient.prototype.getProject = function (projectId) {
    return client('/rest/admin/project/' + projectId)
        .then(handleXmlResponse);
};

YouTrackClient.prototype.getProjectList = function (projectIds) {
    return when.map(projectIds, this.getProject);
};

YouTrackClient.prototype.getUser = function (username) {
    return client('/rest/user/' + username)
        .then(handleXmlResponse);
};

YouTrackClient.prototype.getAllUsers = function () {
    return client('/rest/user/').then(handleXmlResponse);
};

YouTrackClient.prototype.getUserGroups = function (username) {
    return client('/rest/admin/user/' + username + '/group')
        .then(handleXmlResponse);
}

YouTrackClient.prototype.getAllProjectIssues = function (projectId) {
    return client(encodeURI('/rest/issue?filter=for: ' + projectId + '&max=1000&with=id&with=summary&with=created&with=updated&with=Assignee&with=Estimation&with=Spent time'))
        .then(handleXmlResponse);
};

module.exports = YouTrackClient;