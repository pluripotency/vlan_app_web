#! /bin/sh
CURRENT=$(cd $(dirname $0);pwd)
source $CURRENT/env
if docker ps -a | grep -q ${CONTAINER_NAME}; then
  docker logs -f `docker ps -aq -f name=^${CONTAINER_NAME}$`
fi
