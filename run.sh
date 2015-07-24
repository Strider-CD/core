#!/bin/bash
LOG=""
if [ -n "${MICROSERVICES_DEBUG}" ]; then
    LOG="--seneca.log.quiet"
    node microservices.js &
else
    node microservices.js >/dev/null 2>&1 &
fi
MICROSERVICES_PID=$!
trap 'kill $MICROSERVICES_PID' EXIT
node index.js ${LOG}
