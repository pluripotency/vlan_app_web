#! /bin/sh
CURRENT=$(cd $(dirname $0);pwd)
sh ${CURRENT}/stop.sh
sh ${CURRENT}/only_start.sh
