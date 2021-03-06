# Welcome to Watchdog
Watchdog is a AngularJS/Node.js web application which lets you to quickly visualize snapshots taken by your surveillance cameras.

Surveillance cameras can take snapshots on motion detection and send them to an e-mail address. But often sensibility is not easy to configure and many false positives snapshots are taken.
Watchdog can fetch these snapshots, store them to a Cassandra database with the associated meta data (date, time, camera name) and display them on a web interface, where you will be able to easily filter and scroll them.

Authentication to the interface is handled by user/password and JWT.

## Requirements
* Node.js >= 6.9
* Apache Cassandra >= 3.9
* Google Chrome

## Installation
This short guide will walk you through the installation of the application.

### Database configuration
```
# Start cqlsh using the superuser name and password
cqlsh -u supercassandra -p supercassandra
# You can create a user for the application
CREATE USER watchdog WITH PASSWORD 'watchdog' NOSUPERUSER;
# Create the keyspace
CREATE KEYSPACE watchdog WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}  AND durable_writes = true;
# Grant permissions
GRANT ALL PERMISSIONS ON KEYSPACE watchdog TO watchdog;
# Log with your user
cqlsh -u watchdog -p 'watchdog'
# Create the tables, the cql commands are in db/cassandra.init.cql
```

### Database configuration using Docker
Alternatively a [Dockerfile](https://github.com/swayvil/watchdog/blob/master/docker/cassandra/Dockerfile) is available.
```
cd watchdog/docker/cassandra
chmod +x docker-entrypoint.sh
# Build the container
docker build -t watchdog/cassandra:3.11 .
# Run the container
docker run -d -p 7000:7000 -p 7001:7001 -p 7199:7199 -p 9042:9042 -p 9160:9160 --name cassandra watchdog/cassandra:3.11
# Enter the container
docker exec -it cassandra /bin/bash
# Run the cql scripts to initialize the database
cd /tmp
cqlsh -u cassandra -p cassandra -f 1.cassandra.init.cql
cqlsh -u watchdog -p watchdog123 -f 2.cassandra.create.cql
```

### Installation of the application
#### Installation on Windows
##### Pre-requirements
Sharp is used to resize snapshots and made small one, so you need to install [sharp](http://sharp.readthedocs.io/en/stable/install/) requirements:
```
npm install npm -g
```
Install all the required tools and configurations using Microsoft's windows-build-tools from an elevated PowerShell or CMD.exe (run as Administrator):
```
npm install --global --production windows-build-tools
```

##### Get the application
```
git clone https://github.com/swayvil/watchdog.git
```

##### Install Node.js dependencies
```
cd WATCHDOG_HOME/server
npm install
```

#### Installation on Linux
##### Pre-requirements
Sharp is used to resize snapshots and made small one, so you need to install [sharp](http://sharp.readthedocs.io/en/stable/install/) requirements:
```
apt-get update
apt-get -qy install build-essential \
    gcc \
    make \
    build-essential
```

##### Get the application
```
git clone https://github.com/swayvil/watchdog.git
```

##### Install node.js dependencies
```
cd WATCHDOG_HOME/server
npm install
```

#### Installation on Raspberry Pi
Use the Docker files in "docker.raspberry-pi" directory.

### Configuration of the application
Edit WATCHDOG_HOME/server/config.json and update:
* "apiUrl" and "httpServerPort" with the hostname and HTTP port of your instance;
* "secret" with a secret used by JWT;
* "imapconfig" section with the connection information of the imap server where are the snapshots;
* "dbconfig" section with the connection information of the Cassandra database;
* "mailpatterns" with the regular expressions of the e-mails which contain the snapshots;
* "logger" with the path of log files which will be generated by the application.

Eventually adapt WATCHDOG_HOME/services/record-info-parser.js if you want to use your own regular expressions to parse the e-mails.

## Start the application
```
node server.js
```

By default the user "admin" is created with the password "admin".

## License
Watchdog is released under the [MIT License](http://www.opensource.org/licenses/MIT).
