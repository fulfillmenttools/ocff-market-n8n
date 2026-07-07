# Plan: Get `@fulfillmenttools/n8n-nodes-fulfillmenttools` to a Verified n8n Community Node

## Context

The repo `ocff-market-n8n` already contains a working n8n community-node package
with a credential, a Facility action node (Create Managed Facility, Create
Supplier Facility, Get, Get Many, Update, Delete) and an event Trigger node.
Built with `@n8n/node-cli`; `build` + `lint` pass; pushed to GitHub. Goal: take
it from "works locally" to **verified by n8n**, so it appears in the nodes panel
and is installable on **n8n Cloud** (unverified community nodes can't be
installed on Cloud).

Decisions made with the user:
- **Full UX polish** (concrete fixes + Resource Locator + Simplify + Upsert-deferred).
- **Scoped package**: rename to **`@fulfillmenttools/n8n-nodes-fulfillmenttools`** (needs the `@fulfillmenttools` npm org).

This document captures (1) n8n's verification requirements, (2) current status
vs them, (3) a step-by-step plan. Code is verified good on the hard technical
gates already; remaining work is mostly UX guideline compliance + publishing.

---

## Part 1 — n8n Verified Community Node Requirements

Sources: n8n docs — Verification guidelines, UX guidelines, Submit community nodes, Publishing to npm, Node linter.

### A. Hard technical (verification-guidelines)
1. Built with the `n8n-node` CLI scaffolding.
2. Not a duplicate; no Logic/Flow-control nodes.
3. Exactly one third-party service per package (a Trigger for the same service may be bundled).
4. **Zero runtime dependencies** (no `dependencies` in package.json).
5. **No env-var / filesystem access** (no `process.env`, `fs`, `child_process`).
6. TypeScript, proper error handling, consistent style.
7. `npm run lint` **and** `npx @n8n/scan-community-package <pkg>` pass.
8. **English only** (UI + README).
9. License **MUST be MIT**.

### B. Package / source (submit-community-nodes)
10. Name starts with `n8n-nodes-` or `@scope/n8n-nodes-`.
11. Keyword `n8n-community-node-package`.
12. Nodes + credentials registered under `n8n` in package.json.
13. npm `repository` URL matches the public GitHub repo; author matches; repo public.
14. Proper README (install, operations, credentials, usage).
15. **Published to npm via a GitHub Actions workflow with a provenance statement** — mandatory from **May 1 2026**; no local publishing. Needs `@n8n/node-cli >= 0.23.0`.
16. npm one-time setup: register the repo's `publish.yml` as a **Trusted Publisher** (OIDC) or set `NPM_TOKEN` secret.

### C. UX guidelines (required for candidacy)
17. Sensitive credential fields = `password`; include OAuth credential if the service offers it.
18. CRUD ops per resource: Create, Create-or-Update (Upsert), Delete, Get, Get Many, Update.
19. **Resource Locator** (default mode `From list`) for selecting a single item, instead of a raw ID string.
20. **Delete output** = `[{ "deleted": true }]`.
21. **Simplify** boolean when a response has >10 fields ("Whether to return a simplified version of the response instead of the raw data").
22. Title Case for node name / display names / dropdown titles; Sentence case for `action`, descriptions, tooltips, hints.
23. **Placeholders** start with `e.g. `.
24. Operation `action` = sentence case + includes resource; `name` = Title Case.
25. Boolean descriptions start with "Whether…".
26. Errors: what happened + how to fix; avoid "error/problem/failure"; include param `displayName` and `[item N]`.

### D. Submission
27. Publish via the Action, then submit through the **n8n Creator Portal** (creators.n8n.io/nodes). n8n may reject nodes competing with its paid/enterprise features (fulfillmenttools is an OMS — not competing).

---

## Part 2 — Current status vs requirements (from code audit)

### Already PASS ✅
- Built with `@n8n/node-cli` (installed **0.37.4** — satisfies the ≥0.23.0 provenance floor).
- **Zero runtime dependencies** (no `dependencies` key at all).
- **No env/fs access** (grep clean; credentials read only via `getCredentials`).
- **No third-party imports** (only `n8n-workflow` + local modules).
- **MIT** LICENSE file + package.json (Copyright 2026 fulfillmenttools GmbH).
- Keyword `n8n-community-node-package` present; nodes+credentials in `n8n` block.
- Icons + codex files present for both nodes; credential fields are `password`.
- English UI (only cosmetic non-ASCII: the sample `Mrs. Müller`).
- One service + its Trigger — correct package shape.
- CI (`ci.yml`) + provenance-capable `publish.yml` present.
- CRUD largely covered (Create ×2, Get, Get Many, Update, Delete).

### GAPS to fix ❌
| # | Gap | Severity |
|---|-----|----------|
| G1 | Package name is unscoped → rename to `@fulfillmenttools/n8n-nodes-fulfillmenttools` + `publishConfig.access=public` | decision |
| G2 | Delete returns `{ success, facilityId }` → must be `{ deleted: true }` | P0 |
| G3 | Codex `.node.json` `node` uses reserved `n8n-nodes-base.*` prefix → must be `<packageName>.<nodeName>` | P0 |
| G4 | Placeholders don't start with `e.g. ` (~27 across FacilityDescription + Trigger) | P0 |
| G5 | `package.json` missing `engines`; `@n8n/node-cli` pinned to `"*"` → `>=0.23.0` | P0 |
| G6 | README Operations documents only "Create" (missing 5 ops + Trigger) | P0 |
| G7 | German umlaut sample `Mrs. Müller` → ASCII English sample | P1 |
| G8 | No Resource Locator for facility ID (Get/Update/Delete use raw string) | P1 (UX) |
| G9 | No Simplify parameter (facility responses >10 fields) | P1 (UX) |
| G10 | No provenance/Trusted-Publisher configured on npm; not yet published | P0 (publish) |
| — | Upsert (Create-or-Update): **defer** (needs GET-then-write + version) | P2 |
| — | Two weekday `eslint-disable` ordering suppressions: **keep** (justified) | none |
| — | Node displayName lowercase `fulfillmenttools`: keep (brand), be ready to justify | low |

---

## Part 3 — Step-by-step plan

### Phase 1 — Scoped rename (G1)
- `package.json`: `name` → `@fulfillmenttools/n8n-nodes-fulfillmenttools`; add `"publishConfig": { "access": "public" }` (scoped packages are private by default).
- `n8n` block dist paths stay unchanged. `repository` URL already correct.
- README install text → scoped name.

### Phase 2 — P0 correctness fixes
- **G2 Delete output** — `nodes/Fulfillmenttools/Fulfillmenttools.node.ts` (delete branch, ~line 152): `responseData = { deleted: true };`
- **G3 Codex identifiers** — edit **source** `nodes/Fulfillmenttools/Fulfillmenttools.node.json` → `"@fulfillmenttools/n8n-nodes-fulfillmenttools.fulfillmenttools"` and `FulfillmenttoolsTrigger.node.json` → `"…​.fulfillmenttoolsTrigger"` (must equal `<packageName>.<description.name>`; do NOT hand-edit `dist/` copies — they regenerate on build).
- **G5 package.json** — pin `"@n8n/node-cli": ">=0.23.0"`; add `"engines": { "node": ">=20.15" }`.
- **G4/G7 Placeholders** — `nodes/Fulfillmenttools/descriptions/FacilityDescription.ts`: prefix every **value** placeholder with `e.g. ` (name, companyName, street, houseNumber, city, postalCode, country, province, timeZoneId, phone value/label, email value, currency, closing-day reason, tenantFacilityId ×3, etc. — ~26 sites). Leave `Add …` button labels unchanged. Replace `to care of: Mrs. Müller` (lines ~410, ~526) with an ASCII English sample (`e.g. c/o Jane Doe`). Fix `roleDescription` placeholder to a single value (`e.g. Manager`). Also `FulfillmenttoolsTrigger.node.ts` (~line 170): `e.g. n8n Order Modified`.

### Phase 3 — UX enhancements (full-polish)
- **G8 Resource Locator** for `facilityId` (Get/Update/Delete):
  - In `FacilityDescription.ts` replace the `facilityId` string prop with `type: 'resourceLocator'`, `default: { mode: 'list', value: '' }`, modes: **From List** (`type: 'list'`, `searchListMethod: 'searchFacilities'`, `searchable: true`, default) and **By ID** (`type: 'string'`, URN hint).
  - In `Fulfillmenttools.node.ts` add a `methods = { listSearch: { async searchFacilities(this: ILoadOptionsFunctions, filter?) {...} } }` that calls the existing `fulfillmenttoolsApiRequestAllItems(this, '/api/facilities', 'facilities')` (already accepts `ILoadOptionsFunctions`) and maps `{ name: f.name, value: f.id }` with client-side `filter`.
  - Read the value via `getNodeParameter('facilityId', i, '', { extractValue: true })` at the 3 call sites (get/update/delete). Add `ILoadOptionsFunctions`, `INodeListSearchResult` to the `n8n-workflow` type import.
- **G9 Simplify** for Get/Get Many:
  - Add a `Simplify` boolean (default false, shown for get+getAll) in `FacilityDescription.ts` with the exact "Whether to return a simplified version…" description.
  - Add `simplifyFacility(f)` helper to `FacilityFunctions.ts` returning ~10 key fields (id, name, tenantFacilityId, status, type, locationType, address summary, created, lastModified). **Verify `created`/`lastModified` field names against a real facility payload** before finalizing.
  - In `Fulfillmenttools.node.ts`, once before `constructExecutionMetaData`, if `operation` is get/getAll and `simplify` is true, map the response through `simplifyFacility`.

### Phase 4 — README (G6)
- Rewrite the **Operations** section to document all six Facility operations (with endpoints, required fields, Simplify/Resource Locator notes) and a **Trigger** section (webhook subscription lifecycle, event selection, event families). Keep everything English.

### Phase 5 — Verify locally
- `npm run build` → must succeed.
- `npm run lint` → must pass (re-checks placeholders, ordering, resource locator).
- `npm run dev:local` (or `dev:local:no-tunnel`) → in n8n: test Get "From list" (resource locator search), Get with Simplify on/off, Delete returns `{deleted:true}`, Create Managed + Supplier still work, Trigger still registers a subscription (`dev:local` tunnel). Re-run the earlier SQLite execution check if needed.

### Phase 6 — npm publishing setup (G10) — user-owned, one-time
- Ensure the **`@fulfillmenttools` npm org** exists and the publisher is a member.
- On npmjs.com → package settings → **Publish access → Trusted Publishers → Add**: GitHub Actions, owner `fulfillmenttools`, repo `ocff-market-n8n`, workflow `publish.yml`. (No long-lived token needed; OIDC. Alternatively store `NPM_TOKEN` in repo Actions secrets.)
- Confirm `.github/workflows/publish.yml` is the current n8n starter workflow (it is) and that `npm run release` (→ `n8n-node release`, v0.37.4) emits provenance.

### Phase 7 — Publish + submit
- Bump version (e.g. `0.1.0` → `1.0.0` or `0.2.0`), update `CHANGELOG.md`.
- `npm run release` locally → bumps, tags, pushes → **`publish.yml`** publishes the scoped package to npm **with provenance**.
- Run `npx @n8n/scan-community-package @fulfillmenttools/n8n-nodes-fulfillmenttools` against the published package; fix any findings and re-publish if needed.
- Sign in to the **n8n Creator Portal** (creators.n8n.io/nodes) and submit for verification.

---

## Critical files to modify
- `package.json` — name (scoped), `publishConfig`, `engines`, node-cli pin.
- `nodes/Fulfillmenttools/Fulfillmenttools.node.ts` — delete output, `methods.listSearch`, `extractValue` reads, Simplify hook.
- `nodes/Fulfillmenttools/descriptions/FacilityDescription.ts` — placeholders, resource locator, Simplify prop.
- `nodes/Fulfillmenttools/FacilityFunctions.ts` — `simplifyFacility` helper.
- `nodes/Fulfillmenttools/Fulfillmenttools.node.json` + `FulfillmenttoolsTrigger.node.json` — codex `node` identifier.
- `nodes/Fulfillmenttools/FulfillmenttoolsTrigger.node.ts` — subscriptionName placeholder.
- `README.md` — Operations + Trigger docs, scoped install name.
- `CHANGELOG.md` — release notes.

## Reused existing utilities
- `fulfillmenttoolsApiRequest`, `fulfillmenttoolsApiRequestAllItems` — `nodes/Fulfillmenttools/GenericFunctions.ts` (the latter already accepts `ILoadOptionsFunctions`, so the resource-locator search reuses it directly).
- `buildManagedFacilityForCreation`, `buildSupplierForCreation`, `buildManagedFacilityForModification` — `nodes/Fulfillmenttools/FacilityFunctions.ts`.
- `publish.yml` / `ci.yml` — existing GitHub Actions (provenance-ready).

## Verification (end-to-end)
1. `npm run build` and `npm run lint` both exit 0.
2. Local n8n (`npm run dev:local`): resource-locator "From list" populates facilities; Simplify trims output; Delete outputs `{deleted:true}`; both Create ops + Update work; Trigger registers a subscription via the tunnel.
3. After publish: `npx @n8n/scan-community-package @fulfillmenttools/n8n-nodes-fulfillmenttools` passes.
4. Provenance visible on the npm package page; repo/author match.
5. Creator Portal submission accepted.

## Out of scope / deferred
- **Upsert** (Create or Update) operation — feasible via GET-by-URN then POST/PATCH (auto-filling `version`), but adds a stateful flow; document as a future enhancement.
- Additional resources (Orders, Stock, Listings, Pickjobs) — separate future work; each new service would be its own package per rule A3 (this package stays fulfillmenttools-only).
