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

/*
 * The express user service encapsulates all data access and business logic for users behind a simple interface.
 * It exposes methods for CRUD operations and user authentication.
 * All the service methods are implemented using promises in order to keep the users api controller simple
 * and consistent, so all service methods can be called with the pattern [service method].then(...).catch(...);
 */

var config  = require('../config.json');
var _       = require('lodash');
var jwt     = require('jsonwebtoken');
var bcrypt  = require('bcrypt');
var Q       = require('q'); // a promise library
var db      = require('./cassandra-client');

var imapHandler = require('./imap-client');

var service = {};
service.authenticate = authenticate;
service.getByName = getByName;
service.create = create;
service.update = update;
//service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();

    //db.users.findOne({ username: username }, function (err, user) {
    db.users.findUserByName(username, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user != null && bcrypt.compareSync(password, user.password)) {
            // authentication successful
            deferred.resolve(jwt.sign({ username: user.username, isadmin: user.isadmin }, config.secret));
            imapHandler.fetchNewSnapshots();
        } else {
            // authentication failed
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function getByName(username) {
    var deferred = Q.defer();

    db.users.findUserByName(username, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });
    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();

    // validation
    //db.users.findOne(
    db.users.findUserByName(
        userParam.username,
        function (err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            if (user != null && user.username) {
                // username already exists
                deferred.reject('Username "' + userParam.username + '" is already taken');
            } else {
                createUser();
            }
        });

    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');

        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);

        //db.users.insert(
        db.users.createUser(
            user,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                deferred.resolve();
            }
        );
    }
    return deferred.promise;
}

function update(_id, userParam) {
    var deferred = Q.defer();
    //
    //function updateUser() {
    //    // fields to update
    //    var set = {
    //        username: userParam.username,
    //    };
    //
    //    // update password if it was entered
    //    if (userParam.password) {
    //        set.hash = bcrypt.hashSync(userParam.password, 10);
    //    }
    //
    //    db.users.update(
    //        { _id: mongo.helper.toObjectID(_id) },
    //        { $set: set },
    //        function (err, doc) {
    //            if (err) deferred.reject(err.name + ': ' + err.message);
    //
    //            deferred.resolve();
    //        });
    //}
    //
    return deferred.promise;
}

//function _delete(_id) {
//    var deferred = Q.defer();
//
//    db.users.remove(
//        { _id: mongo.helper.toObjectID(_id) },
//        function (err) {
//            if (err) deferred.reject(err.name + ': ' + err.message);
//
//            deferred.resolve();
//        });
//
//    return deferred.promise;
//}