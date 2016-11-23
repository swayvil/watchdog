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

var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config.json');
var cameraService = require('../services/camera.service');
var Q = require('q');

router.get('/snapshot/:snapshotId', getSnapshot);
router.get('/datelist', getDateList);
router.get('/cameralist', getCameraList);
router.get('/snapshots/:limit/:isScrolling/:date/:camera', getSnapshots);

var dateList = null;
var cameraList = null;

function getDateList(req, res) {
	if (dateList === null) {
	    cameraService.getDateList().then(function (dates) {
	        if (dates) {
	            dateList = dates;
	            res.json(dates);
	        }
	        else {
	            res.json(null);
	        }
	    }).catch(function (err) {
	        console.log(err);
	        res.status(400).send(err);
	    });
	} else {
		res.json(dateList);
	}
}

function getCameraList(req, res) {
    cameraService.getCameraList().then(function (cameras) {
        if (cameras) {
            cameraList = cameras;
            res.json(cameras);
        }
        else {
            res.json(null);
        }
    }).catch(function (err) {
        console.log(err);
        res.status(400).send(err);
    });
}

function getDateSelected(date) {
    var deferred = Q.defer();

    if (date == 'undefined') {
        if (dateList === null) {
            cameraService.getDateList().then(function (dates) {
                if (dates) {
                    dateList = dates;
                    deferred.resolve(dateList[0]);
                } else {
                	deferred.reject('No snapshots in database');
                } 	
            }).catch(function (err) {
                deferred.reject(err);
                console.log(err);
            });
        }
        else {
            deferred.resolve(dateList[0]);
        }
    }
    else {
        deferred.resolve(date);
    }
    return deferred.promise;
}

function getCameraSelected(camera) {
    if (camera == 'undefined' || camera == 'All' || camera == 'null')
        return null;
    return camera;
}

function getCountToSelect(isScrolling, countToSelect, currentDate, cameraSelected) {
    var deferred = Q.defer();
    
    if (!currentDate) {
    	deferred.reject('No snapshots in database');
    } else {
    	if (isScrolling == 'true') {
	        deferred.resolve(countToSelect);
	    }
	    else {
	        cameraService.getCountToSelect(currentDate, cameraSelected).then(function (count) {
	            if (count)
	                deferred.resolve(count);
	            else
	                deferred.resolve(0);
	        }).catch(function (err) {
	            deferred.reject(err);
	            console.log(err);
	        });
	    }
    }
    return deferred.promise;
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getSnapshots(req, res) {
    getDateSelected(req.params.date)
        .then(function (dateSelected) {
            var cameraSelected = getCameraSelected(req.params.camera);
            var currentDate = dateSelected;

            getCountToSelect(req.params.isScrolling, req.session.countToSelect, currentDate, cameraSelected)
                .then(function (count) {
                    req.session.countToSelect = count;
                    if (req.params.isScrolling != 'true') {
                        req.session.pageState = null;
                    }
                    else { // scrolling
                        if (req.session.currentdate != null) // get last day used for select
                            currentDate = req.session.currentdate;
                    }
                    cameraService.getSnapshots(req.params.limit, req.session.pageState, currentDate, cameraSelected)
                        .then(function (dbResult) {
                            if (dbResult) {
                                var restResponse = {};
                                restResponse.snapshotList = dbResult.snapshotList;
                                if (dbResult.pageState != null) {
                                    req.session.pageState = dbResult.pageState.toString('hex');
                                    req.session.currentdate = currentDate;
                                }
                                else {
                                    var date = new Date(currentDate);
                                    //TODO: take next date from date list
                                    req.session.currentdate = date.addDays(1);
                                }
                                req.session.countToSelect -= dbResult.snapshotList.length;
                                restResponse.isMoreSnapshotsToLoad = (req.session.countToSelect > 0);
                                res.json(restResponse);
                            }
                            else {
                                res.sendStatus(404);
                            }
                        })
                })
        })
        .catch(function (err) {
            console.log(err);
            res.status(400).send(err);
        });
}

function getSnapshot(req, res) {
    cameraService.getSnapshot(req.params.snapshotId)
        .then(function (snapshot) {
            if (snapshot) {
                res.send(snapshot);
            }
            else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

module.exports = router;