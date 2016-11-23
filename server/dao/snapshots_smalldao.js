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

var queries = require('../cql/snapshots_small.json');
//require('datejs'); //DateJS extends the built in Date object

//Snapshot schema:
//{
//  "id": {"type": "string"},
//  "camera": {"type": "string"},
//  "snapshotsmall": {"type": "string"},
//  "timestamp": {"type": "timestamp"},
//  "day": {"type": "timestamp"}
//}

module.exports = function (cassandraClient) {
    var snapshotsSmall = {};

    snapshotsSmall.insertSnapshotSmall = insertSnapshotSmall;
    snapshotsSmall.getCameraList = getCameraList;
    snapshotsSmall.getDateList = getDateList;
    snapshotsSmall.getSnapshotsSmall = getSnapshotsSmall;
    snapshotsSmall.getCountToSelect = getCountToSelect;

    function insertSnapshotSmall(snapshot) {
        try {
            var strQuery = queries.insertSnapshotsSmall;
            cassandraClient.execute(strQuery, [snapshot.id, snapshot.camera, snapshot.snapshotsmall, snapshot.timestamp, snapshot.day], { prepare: true}, function(err, result) {
                if (err)
                    if (err) throw err;
                console.log('Snapshot inserted');
            });
        }
        catch (err) {
            console.log(err);
            logger.error(err);
        }
    }

    //function getArrayUnique(array) {
    //    var u = {}, a = [];
    //    for (var i = 0, l = array.length; i < l; ++i) {
    //        if (u.hasOwnProperty(array[i])) {
    //            continue;
    //        }
    //        a.push(array[i]);
    //        u[array[i]] = true;
    //    }
    //    return a;
    //}

    //TODO: add sort directly here
//    Array.prototype.getUnique = function(name_param){
//        var u = {}, a = [];
//        for (var i = 0, l = this.length; i < l; ++i) {
//            var elem = this[i][name_param];
//            if (u.hasOwnProperty(elem)) {
//                continue;
//            }
//            a.push(elem);
//            u[elem] = true;
//        }
//        return a;
//    }

    //Simplify the array
    function array2DimTo1(a, paramName) {
        var result = [];

        for (var i = 0; i < a.length; i++)
            result.push(a[i][paramName]);
        return result;
    }

    function getDateList(callback) {
        try {
            var strQuery = queries.selectDates;
            cassandraClient.execute(strQuery, [], { prepare: true }, function(err, dates) {
                if(err) {
                    if (err) throw err;
                } else {
                    if (dates != null) {
                        dates = array2DimTo1(dates.rows, 'day');
                        dates.sort(function (a, b) {
                            return b - a;
                        });
                    }
                    if (typeof(callback) == 'function')
                        callback(err, dates);
                }
            });
        }
        catch (err) {
            console.log(err);
            logger.error(err);
        }
    }

    function getCameraList(callback) {
        try {
            var strQuery = queries.selectCameras;
            cassandraClient.execute(strQuery, [], { prepare: true}, function(err, cameras) {
                if(err) {
                    if (err) throw err;
                } else {
                    var result = null;
                    if (cameras != null) {
                        result = array2DimTo1(cameras.rows, 'camera');
                        result.sort();
                    }
                    if (typeof(callback) == 'function')
                        callback(err, result);
                }
            });
        }
        catch (err) {
            console.log(err);
            logger.error(err);
        }
    }

    function getSnapshotsSmallExec(options, strQuery, parameters, callback) {
        try {
            var snapshots = [];
            cassandraClient.eachRow(strQuery, parameters, options, function (n, row) {
                snapshots.push(row);
                }, function (err, result) {
                    if (err) {
                        if (err) throw err;
                    } else {
                        if (typeof(callback) == 'function') {
                            // The next paging state is stored in result.pageState
                            result.snapshotList = snapshots;
                            callback(err, result);
                        }
                    }
                }
            );
        }
        catch (err) {
                console.log(err);
                logger.error(err);
            }
    }

    function getSnapshotsSmall(limit, pageState, dateSelected, cameraSelected, callback) {
        var strQuery = '';
        var parameters = [];
        var options = null;

        if (cameraSelected == null) {
            strQuery = queries.selectSnapshotsSmallAllCameras;
            parameters = [dateSelected];
        }
        else {
            strQuery = queries.selectSnapshotsSmall;
            parameters = [dateSelected, cameraSelected];
        }
        if (pageState == null)
            options = { prepare: true, fetchSize: limit };
        else {
            var pageStateHex = new Buffer(pageState, 'hex');
            options = {pageState: pageStateHex, prepare: true, fetchSize: limit};
        }
        getSnapshotsSmallExec(options, strQuery, parameters, callback);
    }

    function getCountToSelectExec(strQuery, parameters, callback) {
        try {
            //var t0 = new Date().getTime();
            cassandraClient.execute(strQuery, parameters, { prepare: true }, function(err, result) {
                if(err) {
                    if (err) throw err;
                }
                else {
                    var count = 0;
                    if (result != null)
                        count = result.rows[0].count;
                    if (typeof(callback) == 'function')
                        callback(err, count);
                }
                //var t1 = new Date().getTime();
                //console.log("Call to getCountToSelectExec took dao " + (t1 - t0) + " ms.");
            });
        }
        catch (err) {
            console.log(err);
            logger.error(err);
        }
    }

    function getCountToSelect(dateSelected, cameraSelected, callback) {
        var strQuery = '';
        var parameters = [];
        var options = null;

        if (cameraSelected == null) {
            strQuery = queries.selectSnapshotsSmallAllCamerasCount;
            parameters = [dateSelected];
        }
        else {
            strQuery = queries.selectSnapshotsSmallCount;
            parameters = [dateSelected, cameraSelected];
        }
        getCountToSelectExec(strQuery, parameters, callback);
    }

    function compareSnapshot(a, b) {
        if (a.timestamp < b.timestamp)
            return -1;
        if (a.timestamp > b.timestamp)
            return 1;
        return 0;
    }

    return snapshotsSmall;
};