#https://github.com/docker-library/cassandra/blob/4bb926527d4a9eb534508fe0bbae604dee81f40a/3.9/Dockerfile
#https://github.com/ncarlier/dockerfiles/blob/master/cassandra/Dockerfile.arm

FROM resin/rpi-raspbian:jessie-20160831

# explicitly set user/group IDs
RUN groupadd -r cassandra --gid=999 && useradd -r -g cassandra --uid=999 cassandra -d /home/cassandra

# grab gosu for easy step-down from root
ENV GOSU_VERSION 1.7
RUN set -x \
	&& apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/* \
	&& wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture)" \
	&& wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture).asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --keyserver ha.pool.sks-keyservers.net --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 \
	&& gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu \
	&& rm -r "$GNUPGHOME" /usr/local/bin/gosu.asc \
	&& chmod +x /usr/local/bin/gosu \
	&& gosu nobody true \
	&& apt-get purge -y --auto-remove ca-certificates wget

# solves warning: "jemalloc shared library could not be preloaded to speed up memory allocations"
RUN apt-get update && apt-get install -y --no-install-recommends libjemalloc1

RUN apt-get -qy install \
  curl \
  python \
  && rm -rf /var/lib/apt/lists/*
 
ENV CASSANDRA_HOME /usr/local/apache-cassandra-3.9
ENV CASSANDRA_CONFIG /usr/local/apache-cassandra-3.9/conf

# Define java home
ENV JAVA_HOME /usr/lib/jvm/jdk1.8.0_111

RUN mkdir -p /var/lib/cassandra /var/log/cassandra "$CASSANDRA_HOME" $JAVA_HOME \
	&& chown -R cassandra:cassandra /var/lib/cassandra /var/log/cassandra "$CASSANDRA_HOME" \
	&& chmod 777 /var/lib/cassandra /var/log/cassandra "$CASSANDRA_HOME"
	
# Install Java - Download with accepting Oracle license
RUN curl -L -b "oraclelicense=a" -s -o /tmp/java.tgz http://download.oracle.com/otn-pub/java/jdk/8u111-b14/jdk-8u111-linux-arm32-vfp-hflt.tar.gz -O  && \
	tar -xzf /tmp/java.tgz --strip-components=1 -C "$JAVA_HOME"
	
# Install Cassandra
RUN curl -s -o /tmp/cassandra.tgz http://www.apache.org/dist/cassandra/3.9/apache-cassandra-3.9-bin.tar.gz && \
	tar -xzf /tmp/cassandra.tgz --strip-components=1 -C "$CASSANDRA_HOME"

# Add cassandra binaries to the path
ENV PATH=$PATH:/usr/local/apache-cassandra-3.9/bin:$JAVA_HOME/bin

RUN chown -R cassandra:cassandra "$CASSANDRA_HOME" && \
	chmod 777 /usr/local/apache-cassandra-3.9/bin/cassandra &&\
	chmod 777 /usr/local/apache-cassandra-3.9/bin/cqlsh
	
# Authentication
RUN sed -i -e "s/^authenticator.*/authenticator: PasswordAuthenticator/" $CASSANDRA_CONFIG/cassandra.yaml
RUN sed -i -e "s/^authorizer.*/authorizer: CassandraAuthorizer/" $CASSANDRA_CONFIG/cassandra.yaml

# Add entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Add volume
VOLUME /var/lib/cassandra

# Expose ports
# 7000: intra-node communication
# 7001: TLS intra-node communication
# 7199: JMX
# 9042: CQL
# 9160: thrift service
EXPOSE 7000 7001 7199 9042 9160

CMD ["cassandra", "-f"]