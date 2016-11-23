/*--
Copyright (c) 2016 swayvil

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
++*/

'use strict';

var config  = require('../config.json');
var logger  = require('./log-handler');

function initMailPatterns() {
    var mailPatternArray = [];
    for (var i = 0; i < config.mailpatterns.length; i++) {
        var mailPattern = config.mailpatterns[i];

        mailPatternArray.push({mailObjectPattern: new RegExp(mailPattern.object, 'i'), mailBodyPattern: new RegExp(mailPattern.body, 'i')});
    }
    return mailPatternArray;
};

exports.getRecordInfo = function(mailObject, mailBody, dateHeader) {
    try {
        var mailPatternArray = initMailPatterns();
        var recordInfo = {cameraName: '', dateTime: ''};
        var matchIndexLog = 0;

        var matches = mailPatternArray[0].mailObjectPattern.exec(mailObject);
        if (matches) {
            matchIndexLog = 1;
            matches = mailPatternArray[0].mailBodyPattern.exec(mailBody);
            recordInfo.cameraName = matches[1];
            recordInfo.dateTime = formatDateTime1(matches[3], matches[4], matches[5], matches[6]);
        } else {
            matches = mailPatternArray[1].mailObjectPattern.exec(mailObject);
            if (matches) {
                matchIndexLog = 2;
                matches = mailPatternArray[1].mailBodyPattern.exec(mailBody);
                recordInfo.cameraName = matches[1];
                recordInfo.dateTime = formatDateTime2(matches[2]);
            } else {
                matches = mailPatternArray[2].mailObjectPattern.exec(mailObject);
                if (matches) {
                    matchIndexLog = 3;
                    matches = mailPatternArray[2].mailBodyPattern.exec(mailBody);
                    recordInfo.cameraName = matches[1];
                    recordInfo.dateTime = formatDateTime3(matches[2], matches[3]);
                } else {
                    matches = mailPatternArray[3].mailObjectPattern.exec(mailObject);
                    if (matches) {
                        matchIndexLog = 4;
                        matches = mailPatternArray[3].mailBodyPattern.exec(mailBody);
                        recordInfo.cameraName = matches[1];
                        recordInfo.dateTime = formatDateTime4(dateHeader);
                    }
                }
            }

            //Debug:
            //console.log('matchIndexLog:' + matchIndexLog);
            //console.log('mailObject:');
            //console.log(mailObject);
            //console.log('mailBody:');
            //console.log(mailBody);
            //console.log('recordInfo:');
            //console.log(recordInfo);
        }
        if (recordInfo == null || recordInfo.cameraName == null || recordInfo.dateTime == null) {
            logger.info('Problem while getting recordInfo:');
            logger.info('mailObject:');
            logger.info(mailObject);
            logger.info('mailBody:');
            logger.info(mailBody);
            logger.info('recordInfo:');
            logger.info(recordInfo);
        }
        return recordInfo;
    } catch(error) {
        logger.info('ERROR while getting recordInfo - matchIndexLog: ' + matchIndexLog);
        logger.info('mailObject:');
        logger.info(mailObject);
        logger.info('mailBody:');
        logger.info(mailBody);
        logger.info('Error:');
        logger.info(error);
    };
};

var months = ['Jan', 'Feb', 'Mar', 'Apr',
    'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'
];

// Input: Sat Nov 28 23:44:04 2015
// Output: YYYY-MM-DD HH:MM:SS
function formatDateTime1(month, day, time, year) {
    var indexMonth = months.indexOf(month) + 1;
    var res = year + '-'
        + (indexMonth > 9 ? indexMonth : '0' + indexMonth) + '-'
        + (day.length <= 2 ? day : ('0' + day))
        + ' ' + time;
    return res;
}

// Input: 2016/07/24
// Output: YYYY-MM-DD HH:MM:SS
function formatDateTime2(date) {
    return date.replace(new RegExp('/', 'g'), '-') + ' 00:00:00';
}

// Input: date = 2016/07/30, time = 18:43:53
// Output: YYYY-MM-DD HH:MM:SS
function formatDateTime3(date, time) {
    return date.replace(new RegExp('/', 'g'), '-') + ' ' + time;
}

// Input: Sun, 10 Apr 2016 23:50:28 +0200
// Output: YYYY-MM-DD HH:MM:SS
function formatDateTime4(date) {
    var parser = new RegExp("\\w{3}, (\\d{1,2}) (\\w{3}) (\\d{4}) ([\\d:]+).*", 'i');
    var matches = parser.exec(date);
    var day = matches[1];
    var month = matches[2];
    var year = matches[3];
    var time = matches[4];

    var indexMonth = months.indexOf(month) + 1;
    var res = year + '-'
        + (indexMonth > 9 ? indexMonth : '0' + indexMonth) + '-'
        + (day.length <= 2 ? day : ('0' + day))
        + ' ' + time;
    return res;
}