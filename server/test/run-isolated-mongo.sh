#!/bin/sh
# The backend image must contain the server dependencies under /app/node_modules.
set -eu
serverdir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
suffix="$(date +%s)-$$"
network="eatwhat-test-net-$suffix"
mongo="eatwhat-test-mongo-$suffix"
runner="eatwhat-test-runner-$suffix"
backend_image=${EATWHAT_TEST_BACKEND_IMAGE:-eatwhat-backend-local:latest}
mongo_image=${EATWHAT_TEST_MONGO_IMAGE:-mongo:7.0}
network_created=0
mongo_created=0
runner_may_exist=0
cleanup() {
  if [ "$runner_may_exist" = 1 ]; then docker rm -f "$runner" >/dev/null 2>&1 || true; fi
  if [ "$mongo_created" = 1 ]; then docker rm -f "$mongo" >/dev/null 2>&1 || true; fi
  if [ "$network_created" = 1 ]; then docker network rm "$network" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT HUP INT TERM
if docker inspect "$mongo" >/dev/null 2>&1 || docker inspect "$runner" >/dev/null 2>&1; then
  echo 'Test container name already exists; refusing to reuse it.' >&2
  exit 1
fi
docker network create --internal "$network" >/dev/null
network_created=1
docker run -d --name "$mongo" --network "$network" --network-alias eatwhat-integration-mongo "$mongo_image" --bind_ip_all >/dev/null
mongo_created=1
ready=0
for i in $(seq 1 25); do
  if docker exec "$mongo" mongosh --quiet --eval 'db.adminCommand({ping:1}).ok' 2>/dev/null | grep -q '^1$'; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then echo 'Isolated MongoDB did not become ready.' >&2; exit 1; fi
runner_may_exist=1
timeout 120s docker run --rm --name "$runner" --network "$network" -w /tmp \
  -e NODE_PATH=/app/node_modules \
  -e EATWHAT_TEST_MONGO_URI=mongodb://eatwhat-integration-mongo:27017/isolated_eatwhat_integration \
  -v "$serverdir:/source:ro" "$backend_image" sh -c '
    mkdir -p /tmp/eatwhat-test-src/uploads
    cp -a /source/controllers /source/models /source/utils /source/middleware /source/data /source/test /tmp/eatwhat-test-src/
    exec node /tmp/eatwhat-test-src/test/weeklyPlanMongo.integration.cjs
  '
