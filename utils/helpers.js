var when = require('when');
var moment = require('moment');

// TODO don't export it
exports.getPropertyValue = function (obj, objName, propName) {
    var propValue = '';

    if (obj && obj[objName] && obj[objName]['$']) {
        propValue = obj[objName]['$'][propName];
    }

    return propValue;
};

exports.getIssueFieldValue = getIssueFieldValue = function (fields, fieldName) {
    var i, value = '';

    if (!fields) {
        return '';
    }

    for (i = 0; i < fields.length; i++) {
        if (fields[i] && fields[i]['$'] && fields[i]['$']['name'] === fieldName) {
            value = fields[i]['value'];
            break;
        }
    }

    return value;
};

exports.getProjectIds = function (obj) {
    var projects = [],
        projectIds = [],
        i;

    if (obj && obj.projectRefs && obj.projectRefs.project) {
        projects = obj.projectRefs.project;
    }
    
    for (i = 0; i < projects.length; i++) {
        projectIds.push(projects[i]['$']['id']);
    }

    return projectIds;
};

exports.formatProjectList = function (projects) {
    var list = [], p, i;

    for (i = 0; i < projects.length; i++) {
        p = projects[i]['project']['$'];
        list.push({id: p['id'], name: p['name']});
    }

    return list;
};

exports.getUserPosition = function (obj) {
    var groups = [],
        position = '',
        prefix = 'Должность..',
        i;

    if (obj && obj.userGroupRefs && obj.userGroupRefs.userGroup) {
        groups = obj.userGroupRefs.userGroup;
    }

    for (i = 0; i < groups.length; i++) {
        if (groups[i]['$'] && groups[i]['$']['name'].indexOf(prefix) !== -1) {
            position = groups[i]['$']['name'].replace(prefix, '').trim();
        }
    }

    return position;
};

exports.getAssigneeFullName = function (obj) {
    var fullName = '';

    if (obj && obj[0] && obj[0]['$']) {
        fullName = obj[0]['$']['fullName'];
    }

    return fullName;
};

exports.getAssigneeUsername = getAssigneeUsername = function (obj) {
    var username = '';

    if (obj && obj[0] && obj[0]['_']) {
        username = obj[0]['_'];
    }

    return username;
};

exports.getIssueId = function (obj) {
    var id = '';

    if (obj && obj['$']) {
        id = obj['$']['id'];
    }

    return id;
};

exports.getProjectLeadUsername = function (obj) {
    var username = '';

    if (obj && obj['project'] && obj['project']['$']) {
        username = obj['project']['$']['lead'];
    }

    return username;
};

exports.getUserFullName = function (obj) {
    var fullName = '';

    if (obj && obj['user'] && obj['user']['$']) {
        fullName = obj['user']['$']['fullName'];
    }

    return fullName;
};

exports.getIssuesFilteredByDate = function (issues, s, t) {
    var all = [],
        filtered = [],
        since,
        till,
        i;

    if (issues && issues['issueCompacts'] && issues['issueCompacts']['issue']) {
        all = issues['issueCompacts']['issue'];
    }

    if (s) {
        since = s.split('.').reverse().join('-');
        since = moment(since).format('X');
    }

    if (t) {
        till = t.split('.').reverse().join('-');
        till = moment(till).add('days', 1).format('X');
    } else {
        till = moment().format('X');
    }

    for (i = 0; i < all.length; i++) {
        var createdAt = getIssueFieldValue(all[i]['field'], 'created');
        if (createdAt <= till) {
            if (since) {
                if (createdAt >= since) {
                    filtered.push(all[i]);
                }
            } else {
                filtered.push(all[i]);
            }
        }
    }

    return filtered;
};

exports.getProjectIssuesUsers = function (issues) {
    var assignees = [], username, i;

    if (!issues) {
        return [];
    }

    for (i = 0; i < issues.length; i++) {
        username = getAssigneeUsername(getIssueFieldValue(issues[i]['field'], 'Assignee'));
        if (username && assignees.indexOf(username) === -1) {
            assignees.push(username);
        }
    }

    return assignees;
};

/**
 *
 * @param arr [array, array]
 */
exports.getUsernamePositionHash = function (arr) {
    var usernames = arr[0],
        positions = arr[1],
        hash = {},
        i;

    for (i = 0; i < usernames.length; i++) {
        hash[usernames[i]] = positions[i];
    }

    return hash;
};

exports.getUsers = function (obj) {
    var users = [];

    if (obj && obj.userRefs && obj.userRefs.user) {
        users = obj.userRefs.user;
    }

    return users;
};

exports.getUserLogin = function (user) {
    var login = '';

    if (user && user['$'] && user['$']['login']) {
        login = user['$']['login'];
    }

    return login;
};

exports.getUserLoginFullNameHash = function (user) {
    var obj = {};

    if (user && user['user'] && user['user']['$']) {
        obj = {
            login: user['user']['$']['login'],
            fullname: user['user']['$']['fullName']
        };
    }

    return obj;
}

exports.sanitizeValue = function (value) {
    var sanitized = value;

    if (typeof value.replace === "function") {
        sanitized = sanitized.replace(/[&]/g, '\u0026')
        console.log('sanitized: ' + sanitized);
    }

    return sanitized;
};