#!/bin/sh
# Starts a disposable stack on an internal Docker network without published ports.
set -eu
serverdir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
clientdir=$(CDPATH= cd -- "$serverdir/../client" && pwd)
network=codex-eatwhat-e2e-net
mongo=codex-eatwhat-e2e-mongo
backend=codex-eatwhat-e2e-backend
frontend=codex-eatwhat-e2e-frontend
backend_image=${EATWHAT_TEST_BACKEND_IMAGE:-eatwhat-backend-local:latest}
mongo_image=${EATWHAT_TEST_MONGO_IMAGE:-mongo:7.0}
nginx_image=${EATWHAT_TEST_NGINX_IMAGE:-nginx:alpine}
network_created=0
mongo_created=0
backend_created=0
frontend_created=0
keep=0
cleanup() {
  if [ "$keep" = 1 ]; then return; fi
  if [ "$frontend_created" = 1 ]; then docker rm -f "$frontend" >/dev/null 2>&1 || true; fi
  if [ "$backend_created" = 1 ]; then docker rm -f "$backend" >/dev/null 2>&1 || true; fi
  if [ "$mongo_created" = 1 ]; then docker rm -f "$mongo" >/dev/null 2>&1 || true; fi
  if [ "$network_created" = 1 ]; then docker network rm "$network" >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT HUP INT TERM
test -f "$clientdir/dist/index.html"
for container in "$mongo" "$backend" "$frontend"; do
  if docker inspect "$container" >/dev/null 2>&1; then echo "Container already exists: $container" >&2; exit 1; fi
done
if docker network inspect "$network" >/dev/null 2>&1; then echo 'E2E network already exists' >&2; exit 1; fi
docker network create --internal --label org.codex.task=eatwhat-e2e "$network" >/dev/null
network_created=1
docker run -d --name "$mongo" --label org.codex.task=eatwhat-e2e --network "$network" --network-alias eatwhat-e2e-mongo "$mongo_image" --bind_ip_all >/dev/null
mongo_created=1
ready=0
for i in $(seq 1 25); do
  if docker exec "$mongo" mongosh --quiet --eval 'db.adminCommand({ping:1}).ok' 2>/dev/null | grep -q '^1$'; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then echo 'E2E MongoDB did not become ready' >&2; exit 1; fi
docker run -d --name "$backend" --label org.codex.task=eatwhat-e2e --network "$network" --network-alias backend -w /tmp \
  -e NODE_PATH=/app/node_modules -e NODE_ENV=test -e PORT=3000 \
  -e MONGO_URI=mongodb://eatwhat-e2e-mongo:27017/eatwhat_e2e -e JWT_SECRET=e2e-only-secret \
  -v "$serverdir:/source:ro" "$backend_image" sh -c '
    mkdir -p /tmp/eatwhat-e2e-src/uploads
    cp -a /source/controllers /source/models /source/utils /source/middleware /source/data /source/routes /source/public /source/test /tmp/eatwhat-e2e-src/
    cp /source/app.js /tmp/eatwhat-e2e-src/app.js
    exec node /tmp/eatwhat-e2e-src/app.js
  ' >/dev/null
backend_created=1
ready=0
for i in $(seq 1 30); do
  if docker exec "$backend" node -e "require('http').get('http://127.0.0.1:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))" >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then echo 'E2E backend did not become ready' >&2; exit 1; fi
docker exec "$backend" node /tmp/eatwhat-e2e-src/test/fullStackSeed.cjs
docker run -d --name "$frontend" --label org.codex.task=eatwhat-e2e --network "$network" --network-alias frontend \
  -v "$clientdir/dist:/usr/share/nginx/html:ro" -v "$clientdir/nginx.conf:/etc/nginx/source.conf:ro" \
  --entrypoint sh "$nginx_image" -c '
    sed "s/server_name localhost;/server_name localhost; add_header X-Eatwhat-Isolated codex-e2e-only always;/" /etc/nginx/source.conf > /tmp/nginx.conf
    exec nginx -c /tmp/nginx.conf -g "daemon off;"
  ' >/dev/null
frontend_created=1
ready=0
for i in $(seq 1 20); do
  if docker exec "$frontend" wget -qO- http://127.0.0.1/api/health 2>/dev/null | grep -q '^healthy$'; then ready=1; break; fi
  sleep 1
done
if [ "$ready" != 1 ]; then echo 'E2E frontend proxy check failed' >&2; docker logs "$frontend" 2>&1 | tail -20 >&2; exit 1; fi
keep=1
address=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$frontend")
echo "Isolated stack ready at private container address $address:80; run test/stop-isolated-stack.sh after testing."
