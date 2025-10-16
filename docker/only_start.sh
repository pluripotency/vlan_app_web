#! /bin/sh
CURRENT=$(cd $(dirname $0);pwd)
source $CURRENT/env

    # --net host\
    # -p $SERVER_PORT:$SERVER_PORT \
docker run -d \
    -p $SERVER_PORT:$SERVER_PORT \
    --name ${CONTAINER_NAME} \
    --restart=always \
    --log-driver syslog \
    --log-opt syslog-address=udp://${HOSTNAME}:514 \
    --log-opt tag=${CONTAINER_NAME} \
    --log-opt syslog-facility=local1 \
    -e NODE_ENV=production \
    -e SERVER_PORT=$SERVER_PORT \
    -e REDIS_PORT='6379' \
    -e REDIS_IP=${REDIS_IP} \
    -e TZ='Asia/Tokyo' \
    ${IMAGE_NAME} node js/server.js

