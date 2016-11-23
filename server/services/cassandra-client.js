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

var cassandra = require('cassandra-driver');
var config = require('../config.json');
var logger = require('./log-handler');

var cassandraClient = {};
cassandraClient.disconnect = disconnect;
cassandraClient.users = null;
cassandraClient.snapshots = null;
cassandraClient.snapshotsSmall = null;
cassandraClient.client = null;

module.exports = cassandraClient;
connect();

function connect() {
    var authProvider = new cassandra.auth.PlainTextAuthProvider(config.dbconfig.username, config.dbconfig.password);
    cassandraClient.client = new cassandra.Client({contactPoints: [config.dbconfig.host], authProvider: authProvider});
    cassandraClient.client.connect(function (err) {
        if (err) {
            cassandraClient.client.shutdown();
            return console.error('There was an error when connecting', err);
        }
        console.log('Database - Connected to cluster with %d host(s): %j', cassandraClient.client.hosts.length, cassandraClient.client.hosts.keys());
        initDao();
    });
}

function initDao() {
    cassandraClient.users = require('../dao/usersdao')(cassandraClient.client);
    cassandraClient.snapshots = require('../dao/snapshotsdao')(cassandraClient.client);
    cassandraClient.snapshotsSmall = require('../dao/snapshots_smalldao')(cassandraClient.client);
}

function disconnect() {
    console.log('Shutting down database');
    cassandraClient.client.shutdown();
}


