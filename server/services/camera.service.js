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

var db      = require('./cassandra-client');
var Q       = require('q'); // a promise library
var uuid    = require('node-uuid');

var service = {};
service.getDateList = getDateList;
service.getCameraList = getCameraList;
service.getSnapshots = getSnapshots;
service.getSnapshot = getSnapshot;
service.insertSnapshots = insertSnapshots;
service.getCountToSelect = getCountToSelect;

module.exports = service;

function getDateList() {
    var deferred = Q.defer();

    db.snapshotsSmall.getDateList(function (err, dateList) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (dateList) {
            deferred.resolve(dateList);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getCameraList() {
    var deferred = Q.defer();

    db.snapshotsSmall.getCameraList(function (err, cameraList) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (cameraList) {
            deferred.resolve(cameraList);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getSnapshots(limit, pageState, dateSelected, cameraSelected) {
    var deferred = Q.defer();

    db.snapshotsSmall.getSnapshotsSmall(limit, pageState, dateSelected, cameraSelected, function (err, result) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (result) {
            deferred.resolve(result);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getSnapshot(snapshotId) {
    var deferred = Q.defer();

    db.snapshots.getSnapshot(snapshotId, function (err, snapshot) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (snapshot) {
            deferred.resolve(snapshot[0].snapshot);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getCountToSelect(dateSelected, cameraSelected) {
    var deferred = Q.defer();

    db.snapshotsSmall.getCountToSelect(dateSelected, cameraSelected, function (err, nb) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (nb) {
            deferred.resolve(nb);
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function insertSnapshots(snapshot) {
    snapshot.id = uuid.v4(); //eg. 110ec58a-a0f2-4ac4-8393-c866d813b8d1
    snapshot.timestamp = snapshot.timestamp.toString().substring(0, 19) + ' UTC';
    snapshot.day = snapshot.timestamp.toString().substring(0, 10) + ' 00:00:00 UTC'; //eg. 2016-11-02 04:44:09 To 2016-11-02
    db.snapshots.insertSnapshot(snapshot);
    db.snapshotsSmall.insertSnapshotSmall(snapshot);
}