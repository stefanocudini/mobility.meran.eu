FROM node:16.14.0-alpine3.14

ARG OTP_VERSION=1.5.2
ARG GTFS_URL_UPDATETIME="0 2 * * *"

ENV JAVA_MX=4G \
    GBFS_VERSION=1 \
    GTFS_URL=ftp://ftp.sta.bz.it/gtfs/google_transit_shp.zip \
    GTFS_URL_UPDATETIME=$GTFS_URL_UPDATETIME \
    GTFS_URL_UPDATEHOOK=''

RUN apk add --no-cache \
    openjdk8-jre \
    unzip \
    bash \
    curl \
    gdal-tools

RUN mkdir -p /usr/local/share/java
RUN mkdir -p /var/otp
RUN mkdir -p /conf

# OpenTripPlanner Openmove fork https://github.com/openmove/OpenTripPlanner

#RUN curl -o /usr/local/share/java/otp.jar https://repo1.maven.org/maven2/org/opentripplanner/otp/$OTP_VERSION/otp-$OTP_VERSION-shaded.jar
#COPY otp-1.5.0-clusters-extended.jar /usr/local/share/java/otp-unofficial.jar

#RUN curl -Lo otp-unofficial.jar "https://github.com/openmove/OpenTripPlanner/releases/download/v${OTP_VERSION}/otp-${OTP_VERSION}-SNAPSHOT-shaded.jar"
#COPY otp-unofficial.jar /usr/local/share/java/otp-unofficial.jar

COPY otp-1.5.2-openmove.jar /usr/local/share/java/otp-unofficial.jar

COPY otp.sh /usr/local/bin/
COPY otp-unofficial.sh /usr/local/bin/

COPY infrastructure/docker/otp/docker-entrypoint.sh /docker-entrypoint.sh

COPY build-config.json /conf/
COPY router-config.json /conf/
COPY envconfig.js /conf/

COPY ./gtfs2bbox /gtfs2bbox
COPY ./gtfs-import-task /gtfs-import-task

RUN chmod 755 /gtfs-import-task/gtfs-download.sh

RUN cd /gtfs2bbox && \
	npm install

RUN chmod 755 /usr/local/bin/*
RUN chmod 755 /docker-entrypoint.sh

ENTRYPOINT ["/bin/bash"]
CMD ["/docker-entrypoint.sh"]
