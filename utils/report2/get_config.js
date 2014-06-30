var moment = require('moment');

/**
 *
 * @param data
 *      TODO describe data format
 *
 * @returns object
 */
var getConf = function (data) {
    var conf = {},
        userFullName = data[0],
        projectName = data[1],
        dates = data[2],
        since = moment.unix(data[3]),
        till = moment.unix(data[4]),
        start = since.clone(), // start of the week or the month
        end = till.clone(), // end of the week or the month
        currentDate,
        weekday,
        weekHours,
        dayHours,
        row;

    conf.stylesXmlFile = "utils/report2/styles.xml";

    conf.cols = [
        {
            caption: "ФИО",
            type:'string',
            width: 20
        },
        {
            caption: "Проект",
            type:'string',
            width: 30
        },
        {
            caption: "пн",
            type:'string'
        },
        {
            caption: "вт",
            type:'string'
        },
        {
            caption: "ср",
            type:'string'
        },
        {
            caption: "чт",
            type:'string'
        },
        {
            caption: "пт",
            type:'string'
        },
        {
            caption: "сб",
            type:'string'
        },
        {
            caption: "вс",
            type:'string'
        },
        {
            caption: "ИТОГО за неделю",
            type:'string'
        }
    ];

    if (till.diff(since, 'days') > 7) {
        start.startOf('month');
        end.endOf('month');
    } else {
        start.startOf('week');
        end.endOf('week');
    }

    conf.rows = [];

    currentDate = moment.unix(since.format('X'));
    while (currentDate.diff(end, 'days') <= 0) {
        row = [];
        if (currentDate.unix() === start.unix()) {
            row.push(userFullName);
            row.push(projectName);
        } else {
            row.push(null);
            row.push(null);
        }
        weekday = 1;
        weekHours = 0;
        dayHours = null;
        while (weekday <= 7) {
            if (currentDate.weekday() === weekday % 7) {
                if (currentDate.diff(since, 'days') >= 0 && currentDate.diff(till, 'days') <= 0) {
                    dayHours = dates[currentDate.format('YYYY-MM-DD')] || 0;
                    weekHours += dayHours;
                    row.push(dayHours);
                } else {
                    row.push(null);
                }
                currentDate.add(1, 'day');
            } else {
                row.push(null);
            }
            weekday += 1;
        }
        row.push(dayHours !== null ? weekHours : null);
        conf.rows.push(row);
    }
    conf.rows.push(["Дата выгрузки", moment().format('DD.MM.YYYY'), null, null, null, null, null, null, null, null]);
    conf.rows.push(["Период выгрузки", since.format('DD.MM.YYYY') + ' - ' + till.format('DD.MM.YYYY'), null, null, null, null, null, null, null, null]);

    return conf;
};

module.exports = getConf;