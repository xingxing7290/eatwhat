# Isolated MongoDB integration check

Run `sh test/run-isolated-mongo.sh` from the server directory on a Linux host with Docker, `timeout`, MongoDB 7 and a locally available backend image containing dependencies at `/app/node_modules`. The default images are `mongo:7.0` and `eatwhat-backend-local:latest`; set `EATWHAT_TEST_MONGO_IMAGE` or `EATWHAT_TEST_BACKEND_IMAGE` to override them.

The script creates a temporary internal Docker network, a fresh MongoDB container without host ports or persistent volumes, and a separate backend test container with the current server source mounted read-only. It removes the containers and network on exit. No production database or credentials are used. The test refuses any MongoDB URI except the dedicated test address.

The test exercises real MongoDB indexes, HTTP login and JWT middleware, conditional update and concurrent insert conflicts, reporting partially applied days, retrying against a fresh snapshot, stale single-day selection, safe wish-to-meal linking, repeating a dish across anniversary meal slots, and household data isolation. All accounts, passwords and the JWT secret are test-only. It does not exercise the deployed production service.
