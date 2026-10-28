#!/bin/sh
set -eu
for container in codex-eatwhat-e2e-frontend codex-eatwhat-e2e-backend codex-eatwhat-e2e-mongo; do
  if docker inspect "$container" >/dev/null 2>&1; then
    label=$(docker inspect --format '{{ index .Config.Labels "org.codex.task" }}' "$container")
    if [ "$label" != eatwhat-e2e ]; then echo "Refusing to remove unlabelled container: $container" >&2; exit 1; fi
    docker rm -f "$container" >/dev/null
  fi
done
if docker network inspect codex-eatwhat-e2e-net >/dev/null 2>&1; then
  label=$(docker network inspect --format '{{ index .Labels "org.codex.task" }}' codex-eatwhat-e2e-net)
  if [ "$label" != eatwhat-e2e ]; then echo 'Refusing to remove unlabelled network' >&2; exit 1; fi
  docker network rm codex-eatwhat-e2e-net >/dev/null
fi
echo 'Isolated E2E stack stopped'
