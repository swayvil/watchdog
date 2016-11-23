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

var queries = require('../cql/users.json');

// User schema:
//{
//  "username": {"type": "string"},
//  "password": {"type": "string"},
//  "isadmin": {"type": "boolean"}
//}


module.exports = function (cassandraClient) {
    var userdao = {};

    userdao.findUserByName = findUserByName;
    userdao.createUser = createUser;

    function createUser(user, callback) {
        try {
            var strQuery = queries.insert;
            cassandraClient.execute(strQuery, [user.username, user.hash, false], { prepare: true}, function(err, result) {
                if(err) {
                    if (err) throw err;
                } else {
                    var result = result.first();
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

    function findUserByName(username, callback) {
        try {
            var strQuery = queries.selectByName;
            cassandraClient.execute(strQuery, [username], { prepare: true }, function(err, result) {
                if (err) {
                    if (err) throw err;
                } else {
                    var user = null;
                    if (result != null) // User retrieved successfully
                        user = result.first();
                    if (typeof(callback) == 'function')
                        callback(err, user);
                }
            });
        }
        catch (err) {
            console.log(err);
            logger.error(err);
        }
    }

    return userdao;
};