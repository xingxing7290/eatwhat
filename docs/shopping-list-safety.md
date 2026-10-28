# Shopping-list rollout and recovery

The updated shopping-list interface requires a server that advertises conditional updates. Deploy the server before the web client. Older clients remain supported; simultaneous writes are protected by MongoDB document versioning, but an older client that submits a previously viewed list cannot provide the newer client's stale-view check.

The server requires an unconditional, non-sparse unique index on `(householdId, weekStart)` before it serves or modifies shopping lists. If the index is absent or incompatible, the endpoint returns `SHOPPING_LIST_INDEX_UNAVAILABLE` instead of risking duplicate lists. The application database account needs permission to inspect indexes.

Before deployment, take and verify a private database backup. On a trusted host with the server dependencies, set `MONGO_URI` securely and run a read-only audit with the expected database name:

```sh
node server/scripts/shopping-list-index.js --database whateat
```

The output gives only counts for duplicate household/week pairs and invalid household or week keys; it does not print list contents. Resolve any reported problems manually after backup and re-run the audit. A valid week key is a real date formatted `YYYY-MM-DD` for a Monday. When the audit is clean, add `--apply` to create only the required index. The script refuses to create it when duplicates or invalid keys exist, does not delete or rewrite data, and checks the connected database name. Conflicting pre-existing index definitions may require manual review; the script never drops them.

The web interface also requires a non-negative document version. If an old document lacks one, the list is displayed read-only until its data is reviewed and safely migrated; do not guess a version or overwrite a potentially concurrent list. After rollout, test a representative list with two members, a generated ingredient repeated in multiple meals, and a deliberately stale edit. A network interruption can leave a write outcome unknown, so users should reload and inspect before trying again.
