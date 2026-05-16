# Asset Tracking Challenge

This fork builds the Next.js starter into a trust-repair workflow for lab asset tracking. The app keeps the hot scanner path fast for technicians and gives managers an exception-first view of cross-system drift.

## Run Locally

Use Node 20+ and pnpm 9.15.9, matching `package.json`.

```bash
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm dev
```

Environment variables for `starter/.env`:

```bash
API_BASE_URL=
API_TOKEN=
```

Do not prefix the token with `NEXT_PUBLIC_`. Browser requests go through the starter proxy or server route handlers so `API_TOKEN` stays server-side.

## What Was Built

- Four mobile-first tech workflows: `/tech/receive`, `/tech/store`, `/tech/deploy`, and `/tech/transfer`.
- Server-side store/deploy orchestration routes that write back to Facilities and Finance where required.
- Location parsing for JSON, key-value, full rack slash paths, and storage-friendly slash paths.
- Manager dashboard at `/manager` with morning summary, recent movement, filters, pagination, and a focused asset table.
- Asset detail pages with current truth, readable event timeline, reconciliation context, and collapsed raw metadata.
- Server-side three-way reconciliation at `/api/reconcile` and manager UI at `/manager/reconcile`.
- Printable Code 128 labels at `/dev/barcodes`.

## Three Calls I Nearly Made the Other Way

1. Table-first manager page vs exception-first manager dashboard. Decision: exception-first because the manager has 60 seconds before standup.
2. Raw reconciliation diff vs categorized reconciliation. Decision: categorized because managers need action, not raw mismatches.
3. Camera-first scanner vs focused input first. Decision: focused keyboard/USB scanner path first because this is the hot path; camera remains an optional future fallback.

## Pushback / Confusing Docs

The brief says "three scan endpoints" in one place, but it also requires `/tech/transfer` and `starter/docs/api-reference.md` documents `POST /v1/scans/transfer`. I implemented transfer because the detailed requirement and API contract include it.

## Intentionally Not Built

- Real auth, signup, login, SSO, or password flows: the provided cookie RoleSwitcher is enough for the demo.
- Offline queueing/sync and backend retry queues: partial downstream failures are shown honestly instead.
- RMA UI: the state machine supports it, but the challenge excludes it.
- Bulk import/export: not needed for the scan and reconciliation workflows.
- Hardware driver/pairing integration: scanners type into the focused input.
- Parent-child asset modeling and barcode-tag-as-asset lifecycle: acknowledged as real-world extensions, but outside this take-home.

## Microcopy Note For Loom

For incomplete deploy locations, the UI says: "Deploying puts an asset into service, so the rack unit is required. Scan or enter RU before continuing." I used that wording because it explains the operational reason, names the missing field in the tech's vocabulary, and gives the next physical action.

## Testing Notes

Unit tests were added for location parsing, rack formatting, reconciliation classification, and scan error copy. Manual happy-path coverage should be run after starting `pnpm dev` and resetting with:

```bash
curl.exe -X POST http://localhost:3000/api/upstream/reset
```

On macOS/Linux, `curl -X POST http://localhost:3000/api/upstream/reset` is equivalent. In PowerShell, use `curl.exe`; the `curl` alias can send a form content type that the Fastify API rejects.

Known limitation: camera scanning was not added; the keyboard/USB scanner path is the stable default path.
