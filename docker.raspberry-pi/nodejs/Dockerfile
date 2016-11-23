FROM resin/rpi-raspbian:jessie-20160831

# Create app directory
RUN mkdir -p /usr/src/watchdog
RUN mkdir -p /usr/src/watchdog/public
RUN mkdir -p /usr/src/watchdog/server
RUN mkdir -p /usr/src/watchdog/logs
RUN mkdir -p /usr/local/node

RUN apt-get update && \  
  apt-get -qy install apt-utils \
  curl \
  build-essential python \
  ca-certificates \
  gcc \
  make \
  build-essential
  
WORKDIR /tmp/  
RUN curl -O https://nodejs.org/dist/v6.9.1/node-v6.9.1-linux-armv6l.tar.gz
RUN tar -xvf node-*.tar.gz -C /usr/local/node --strip-components=1

WORKDIR /usr/src/watchdog/server
# Install app dependencies
COPY server/package.json /usr/src/watchdog/server/
RUN npm install

# Install pm2 so we can run our application
RUN npm i -g pm2

# Bundle app source
COPY public /usr/src/watchdog/public
COPY server /usr/src/watchdog/server

EXPOSE 8080
CMD ["pm2", "start", "processes.json", "--no-daemon"]
# the --no-daemon is a minor workaround to prevent the docker container from thinking pm2 has stopped running and ending itself
