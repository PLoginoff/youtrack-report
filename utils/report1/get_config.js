var moment = require('moment');
var helpers = require('./../helpers');

/**
 *
 * @param data
 *      TODO describe data format
 *
 * @returns object
 */
var getConf = function (data) {
    var projectId = data[0],
        projectLeadFullName = data[1],
        issues = data[2],
        usersInfo = data[3],
        workItems = data[4],
        conf = {},
        issueId,
        durations,
        estimationTime,
        spentTime,
        sellTime,
        i;

    conf.stylesXmlFile = "utils/report1/styles.xml";

    conf.cols = [
        {
            caption: "",
            type:'string',
            width:28.7109375
        },
        {
            caption: "",
            type:'string',
            width:28.7109375
        },
        {
            caption: "",
            type:'string',
            width:28.7109375
        },
        {
            caption: "",
            type:'string',
            width:28.7109375
        },
        {
            caption: "",
            type:'string',
            width:28.7109375
        },
        {
            caption: "",
            type:'string',
            width:28.7109375
        }
    ];

    conf.rows = [
        [null, null, "Отчет в часах по клиенту " + projectId, null, null, null],
        [null, null, "ID:", projectId, null, null],
        [null, null, "Дата формирования отчета", moment().format('DD.MM.YYYY'), null, null],
        [null, null, "Руководитель проекта", projectLeadFullName, null, null],
        [null, null, null, null, null, null],
        ["Номер таска", "Наименование работы", "Исполнитель", "Должность", "Время продажи (мин.)", "Затраченное время (мин.)"]
    ];

    for (i = 0; i < issues.length; i++) {
        issueId = helpers.getIssueId(issues[i]);
        durations = workItems[issueId] || {};
        for (var userLogin in durations) {
            if (durations.hasOwnProperty(userLogin)) {
                spentTime = parseInt(helpers.getIssueFieldValue(issues[i]['field'], 'Spent time'), 10);
                estimationTime = parseInt(helpers.getIssueFieldValue(issues[i]['field'], 'Estimation'), 10);
                if (!estimationTime || estimationTime < spentTime) {
                    estimationTime = spentTime;
                }
                sellTime = Math.round(estimationTime * durations[userLogin] / spentTime);

                conf.rows.push([
                    issueId,
                    helpers.sanitizeValue(helpers.getIssueFieldValue(issues[i]['field'], 'summary') + ''),
                    usersInfo[userLogin]['fullName'],
                    usersInfo[userLogin]['position'] || '',
                    sellTime,
                    durations[userLogin]
                ]);
            }
        }
    }

    return conf;
};

module.exports = getConf;