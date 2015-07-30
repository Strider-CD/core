#!/bin/bash
LOG=""
if [ -n "${MICROSERVICES_DEBUG}" ]; then
    node microservices.js &
else
    LOG="--seneca.log.quiet"
    node microservices.js >/dev/null 2>&1 &
fi
MICROSERVICES_PID=$!
trap 'kill $MICROSERVICES_PID' EXIT
node test/*.js ${LOG} | tap-spec
