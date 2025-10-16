#! /bin/sh
CURRENT=$(cd $(dirname $0);pwd)
sh ${CURRENT}/build.sh
sh ${CURRENT}/restart.sh
sh ${CURRENT}/show.sh
