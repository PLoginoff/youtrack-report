var helpers = require('./../helpers');

/**
 *
 * @param data
 *      TODO describe data format
 *
 * @returns object
 */
var getConf = function (data) {
    var issues = data.issues,
        conf = {},
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
        [null, null, "Отчет в часах по клиенту " + data.PROJECT_NAME, null, null, null],
        [null, null, "ID:", data.PROJECT_NAME, null, null],
        [null, null, "Дата формирования отчета", data.GEN_DATE, null, null],
        [null, null, "Руководитель проекта", data.PROJECT_LEAD, null, null],
        ["Номер таска", "Наименование работы", "Исполнитель", "Должность", "Время продажи (мин.)", "Затраченное время (мин.)"]
    ];

    for (i = 0; i < issues.length; i++) {
        conf.rows.push([
            helpers.getIssueId(issues[i]),
            helpers.getIssueFieldValue(issues[i]['field'], 'summary'),
            helpers.getAssigneeFullName(helpers.getIssueFieldValue(issues[i]['field'], 'Assignee')),
            data.assigneePositions[helpers.getAssigneeUsername(helpers.getIssueFieldValue(issues[i]['field'], 'Assignee'))] || '',
            helpers.getIssueFieldValue(issues[i]['field'], 'Estimation'),
            helpers.getIssueFieldValue(issues[i]['field'], 'Spent time')
        ]);
    }

    return conf;
};

module.exports = getConf;