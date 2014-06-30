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

YouTrackClient.prototype.getUsersChunk = function (start) {
    start = start || 0;
    return client('/rest/admin/user/?start=' + start).then(handleXmlResponse);
};

YouTrackClient.prototype.getAllUsers = function () {
    var start = 0,
        users = [],
        that = this;

    var getUser = function (obj) {
        var chunk = [];

        if (obj && obj.userRefs && obj.userRefs.user) {
            chunk = obj.userRefs.user;
        }
        return chunk;
    };

    var addUsers = function (usersChunk) {
        if (usersChunk.length > 0) {
            start += 10;
            users = users.concat(usersChunk);
        } else {
            start = -1;
        }
        return start;
    };

    var f = function (start) {
        return that.getUsersChunk(start)
            .then(getUser)
            .then(addUsers);
    };

    var predicate = function (start) {
        return start === -1;
    };

    var handler = function () {};

    return when.iterate(f, predicate, handler, start).then(function () { return users; });
};

YouTrackClient.prototype.getUserGroups = function (username) {
    return client('/rest/admin/user/' + username + '/group')
        .then(handleXmlResponse);
};

YouTrackClient.prototype.getAllProjectIssues = function (projectId) {
    return client(encodeURI('/rest/issue?filter=for: ' + projectId + '&max=1000&with=id&with=summary&with=created&with=updated&with=Assignee&with=Estimation&with=Spent time'))
        .then(handleXmlResponse);
};

/**
 *
 * @param projectId
 * @param updatedAfter int Unix Timestamp in _seconds_
 * @returns {*}
 */
YouTrackClient.prototype.getProjectIssues = function (projectId, updatedAfter) {
    var uri = '/rest/issue/byproject/' + projectId + '?max=100',
        after = 0,
        issues = [];

    if (updatedAfter !== undefined) {
        uri += '&updatedAfter=' + (updatedAfter * 1000); // convert to milliseconds
    }

    var getIssues = function (obj) {
        var chunk = [];
        if (obj && obj.issues && obj.issues.issue) {
            chunk = obj.issues.issue;
        }
        return chunk;
    };

    var addIssues = function (issuesChunk) {
        if (issuesChunk.length > 0) {
            after += 100;
            issues = issues.concat(issuesChunk);
        } else {
            after = -1;
        }
        return after;
    };

    var f = function (after) {
        return client(uri + '&after=' + after)
            .then(handleXmlResponse)
            .then(getIssues)
            .then(addIssues);
    };

    var predicate = function (after) {
        return after === -1;
    };

    var handler = function () {};

    return when.iterate(f, predicate, handler, after).then(function () { return issues; });
};

YouTrackClient.prototype.getIssueWorkItem = function (issueId) {
    return client('/rest/issue/' + issueId + '/timetracking/workitem/')
        .then(handleXmlResponse);
};

module.exports = YouTrackClient;