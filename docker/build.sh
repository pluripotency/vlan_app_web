#! /bin/sh
CURRENT=$(cd $(dirname $0);pwd)
source $CURRENT/env
# cd $CURRENT/../front
# npx vite build
docker build -f ${CURRENT}/Dockerfile -t ${IMAGE_NAME} ${CURRENT}/..
