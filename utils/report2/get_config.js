var moment = require('moment');
var formatMinutes = require('./../helpers').formatMinutes;
var getUserLogin = require('./../helpers').getUserLogin;

function getUserMinutes(workItems, userLogin) {
    var userTime = [],
        login,
        date,
        i;

    for (i = 0; i < workItems.length; i++) {
        login = getUserLogin(workItems[i]['author'][0]);
        if (login === userLogin) {
            date = moment.unix(Math.ceil(workItems[i]['date'][0]/1000)).format('YYYY-MM-DD');
            if (userTime[date] === undefined) {
                userTime[date] = 0;
            }
            userTime[date] += parseInt(workItems[i]['duration'][0], 10);
        }
    }

    return userTime;
}

/**
 * @param data
 * @returns object
 */
var getConf = function (data) {
    var conf = {},
        userData = data[0],
        projectData = data[1],
        since = moment.unix(data[2]),
        till = moment.unix(data[3]),
        start = since.clone(), // start of the week or the month
        end = till.clone(), // end of the week or the month
        currentDate,
        weekday,
        periodMinutes, // user selected period
        weekMinutes,
        dayMinutes,
        weekCount,
        userMinutes,
        row,
        i;

    conf.stylesXmlFile = "utils/report2/styles.xml";

    conf.cols = [
        {
            caption: "ФИО",
            type:'string',
            width: 50
        },
        {
            caption: "Проект",
            type:'string',
            width: 30
        },
        {
            caption: "пн",
            type:'string',
            width: 12
        },
        {
            caption: "вт",
            type:'string',
            width: 12
        },
        {
            caption: "ср",
            type:'string',
            width: 12
        },
        {
            caption: "чт",
            type:'string',
            width: 12
        },
        {
            caption: "пт",
            type:'string',
            width: 12
        },
        {
            caption: "сб",
            type:'string',
            width: 12
        },
        {
            caption: "вс",
            type:'string',
            width: 12
        },
        {
            caption: "ИТОГО за неделю",
            type:'string',
            width: 30
        }
    ];

    conf.rows = [];

    for (var projectId in projectData) {
        for (var userLogin in userData) {
            conf.rows.push([userData[userLogin], projectData[projectId].nam, null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);

            weekCount = 1;
            userMinutes = getUserMinutes(projectData[projectId].workItems, userLogin);
            periodMinutes = 0;
            start.startOf('week');
            end.endOf('week');
            currentDate = moment.unix(since.format('X'));

            while (currentDate.diff(end, 'days') <= 0) {
                row = [];
                row.push(weekCount + ' неделя (' + currentDate.format('DD.MM.YYYY'));
                row.push(null);
                weekday = 1;
                weekMinutes = 0;
                dayMinutes = null;
                while (weekday <= 7) {
                    if (currentDate.weekday() === weekday % 7) {
                        if (currentDate.diff(since, 'days') >= 0 && currentDate.diff(till, 'days') <= 0) {
                            dayMinutes = userMinutes[currentDate.format('YYYY-MM-DD')] || 0;
                            weekMinutes += dayMinutes;
                            row.push(formatMinutes(dayMinutes));
                        } else {
                            row.push(null);
                        }
                        currentDate.add(1, 'day');
                    } else {
                        row.push(null);
                    }
                    weekday += 1;
                }
                row[0] += ' - ' + currentDate.format('DD.MM.YYYY') + ')';
                row.push(dayMinutes !== null ? formatMinutes(weekMinutes) : null);
                conf.rows.push(row);
                weekCount += 1;
                periodMinutes += weekMinutes;
            }

            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
            conf.rows.push(["Дата выгрузки", moment().format('DD.MM.YYYY'), null, null, null, null, null, null, null, null]);
            conf.rows.push(["Период выгрузки", since.format('DD.MM.YYYY') + ' - ' + till.format('DD.MM.YYYY'), null, null, null, null, null, null, null, null]);
            conf.rows.push(["Итого за период", formatMinutes(periodMinutes), null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
            conf.rows.push([null, null, null, null, null, null, null, null, null, null]);
        }
    }

    return conf;
};

module.exports = getConf;
