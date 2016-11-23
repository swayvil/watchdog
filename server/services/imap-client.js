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

var imapHandler = {};
imapHandler.fetchNewSnapshots = fetchNewSnapshots;
module.exports = imapHandler;

var config = require('../config.json');
var logger = require('./log-handler');
var MailParser = require('mailparser').MailParser;
var cameraService = require('./camera.service');
var recordInfoParser = require('./record-info-parser');
var Imap = require('imap');
var sharp = require('sharp');

var imap = new Imap({
    user: config.imapconfig.username,
    password: config.imapconfig.password,
    host: config.imapconfig.imap.host,
    port: config.imapconfig.imap.port,
    tls: config.imapconfig.imap.tls,
//    debug: console.log,
    keepalive: {
        interval: 10000,
        idleInterval: 60 * 1000,
        forceNoop: true
    }
});
var mails = null;
// Only one execution of fetchNewSnapshots per time
var isFetchNewSnapshotsRunning = false;
// Current indice in mails
var iteratorMail = 0;
// Number of mails processed in parallel
var nbMailsInParallel = 1;

function openInbox(cb) {
    imap.openBox('INBOX', false, cb); // openReadOnly = false
};

function fetchMail() {
    if (iteratorMail >= mails.length) {
        console.log("fetchMail imap end, iteratorMail = " + iteratorMail + ", mails.length: " + mails.length);
        logger.info("fetchMail imap end, iteratorMail = " + iteratorMail + ", mails.length: " + mails.length);
        imap.end();
    }
    else {
        try {
            var fetch = imap.fetch(mails[iteratorMail++], {
                bodies: '',
                markSeen: true
            });
        } catch (err) {
            console.log('Db is up to date.');
            logger.error(err);
            imap.end();
        }

        if (fetch != null) {
            fetch.on('message', function (email, seqno) {
                email.on('body', function (stream, info) {
                    var emailStr = '';
                    stream.on('data', function (chunk) {
                        emailStr += chunk;
                    });

                    stream.on('end', function () {
                        parseMail(emailStr);
                    });
                });
            });
            fetch.once('error', function (err) {
                console.log('Fetch error: ' + err);
                logger.error(err);
            });
            fetch.once('end', function () {
               //console.log('Done fetching all messages!');
            });
        }
    }
}

function parseMail(emailStr) {
    var mailparser = new MailParser();
    var dateHeader = null;
    mailparser.on("headers", function(headers){
        dateHeader = headers.date;
    });
    mailparser.on('end', function (mail_object) {
        if (mail_object.attachments) {
            mail_object.attachments.forEach(function (attachment) {
                var recordInfo = recordInfoParser.getRecordInfo(mail_object.subject, mail_object.text, dateHeader);
                var buff = new Buffer(attachment.content, 'binary');
                if (buff && recordInfo && recordInfo.dateTime && recordInfo.cameraName) {
                    var image = sharp(buff);
                    image
                        .metadata()
                        .then(function (metadata) {
                            return image
                                .resize(Math.round(metadata.width / 4))
                                .webp()
                                .toBuffer();
                        })
                        .then(function (dataImgSmall) {
                            // data contains a WebP image half the width and height of the original JPEG
                            var snapshot = {};
                            snapshot.camera = recordInfo.cameraName;
                            snapshot.snapshot = buff.toString('base64');
                            snapshot.snapshotsmall = dataImgSmall.toString('base64');
                            snapshot.timestamp = recordInfo.dateTime;
                            if (snapshot && snapshot.snapshot) {
                            	cameraService.insertSnapshots(snapshot);
                            }
                        })
                        .then(function () {
                            fetchMail();
                        });
                } else {
                    logger.info("Can't get data from mail: " + mail_object.subject);
                    if (recordInfo) {
                        logger.info("dateTime: " + recordInfo.dateTime);
                    }
                    fetchMail();
                }
            });
        }
        else
            fetchMail();
    });
    mailparser.write(emailStr);
    mailparser.end();
}

function fetchNewSnapshots() {
    if (!isFetchNewSnapshotsRunning) {
        isFetchNewSnapshotsRunning = true;
        try {
            imap.connect();
        } catch (err) {
            console.log(err);
            logger.error(err);
        }
        imap.once('ready', function () {
            openInbox(function (err, box) {
                if (err) throw err;
                imap.search(['UNSEEN',
                    ['SINCE', config.imapconfig.unseensince],
                    ['FROM', config.imapconfig.from]
                ], function (err, results) {
                    if (err) throw err;
                    mails = results;

                    for (var i = 0; i < nbMailsInParallel; i++)
                        fetchMail();
                });
            });
        });
        imap.once('error', function (err) {
            isFetchNewSnapshotsRunning = false;
            iteratorMail = 0;
            console.log(err);
            logger.error(err);
        });

        imap.once('end', function () {
            isFetchNewSnapshotsRunning = false;
            iteratorMail = 0;
            console.log('Imap connection ended');
        });
    }
}