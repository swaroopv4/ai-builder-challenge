# Asset tracking API

The local backend that powers the take-home challenge. Candidates make HTTP requests against this; they don't read or modify its code.

## Running

```bash
# From the monorepo root
pnpm install
pnpm --filter @asset-tracking/api dev
# API on http://localhost:8080
```

Or from this directory:

```bash
pnpm dev
```

First start creates `data/asset-tracking.db` and seeds 12 assets plus the facilities/finance mocks. Subsequent starts reuse the file.

## Reset the database

```bash
curl -X POST http://localhost:8080/v1/reset
```

Or from the starter, `api.reset()`.

## Inspect the database

```bash
sqlite3 api/data/asset-tracking.db
sqlite> .tables
events  assets
sqlite> SELECT asset_tag, state, custodian FROM assets;
```

## Tests

```bash
pnpm --filter @asset-tracking/api test
```

Three suites:

- `test/state-machine.test.ts` — every allowed transition succeeds and every undefined transition is rejected.
- `test/scans.test.ts` — receive (new / idempotent duplicate / and-match failure), store, deploy, missing-asset 404s, reset.
- `test/reconcile-data.test.ts` — verifies the 9 deliberately-engineered cross-system mismatches in the seed data are present.

## Build for production

```bash
pnpm --filter @asset-tracking/api build
node dist/index.js
```

## Environment

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `8080` | |
| `HOST` | `0.0.0.0` | |
| `API_DATA_DIR` | `./data` | Where the SQLite file lives. |
| `API_DB_FILE` | `asset-tracking.db` | SQLite filename. |
| `LOG_LEVEL` | `info` | Standard pino levels. |
