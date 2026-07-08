# n8n-nodes-fulfillmenttools

This is an [n8n](https://n8n.io) community node package for the
[fulfillmenttools](https://fulfillmenttools.com) REST API. It lets you manage
your fulfillmenttools tenant directly from n8n workflows.

[Installation](#installation) · [Operations](#operations) · [Trigger](#trigger) · [Credentials](#credentials) · [Development](#development) · [Resources](#resources)

## Installation

Follow the
[community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
and use the package name `@fulfillmenttools/n8n-nodes-fulfillmenttools`.

> Unverified community nodes can only be installed on self-hosted n8n. On n8n
> Cloud the package must first be published and verified by n8n.

## Operations

### Facility

- **Create Managed Facility** (`POST /api/facilities`) — creates a
  `MANAGED_FACILITY`. Required: name and address (company name, street, city,
  postal code, country). Optional: contact, phone/email addresses, picking
  methods, services, picking times, scanning rules, closing days, tags,
  operative cost, coordinates/time zone, and additional fields (tenant facility
  ID, status, location type, capacity, fulfillment buffer, custom attributes).
- **Create Supplier Facility** (`POST /api/facilities`) — creates a `SUPPLIER`.
  Required: name, company name, country. Optional: address details,
  phone/email addresses, tags, operative cost, status, tenant facility ID,
  custom attributes.
- **Get** (`GET /api/facilities/{id}`) — retrieves a single facility. Select it
  **From list** or **By ID** (a facility ID or a `tenantFacilityId` URN). Supports
  **Simplify**.
- **Get Many** (`GET /api/facilities`) — retrieves many facilities with optional
  filters (order by, status, type, tenant facility ID), **Return All** /
  **Limit**, and **Simplify**.
- **Update** (`PATCH /api/facilities/{id}`) — updates a facility. Requires the
  current **Version** (optimistic locking — get it first with **Get**). Exposes
  common fields plus a raw-JSON field for advanced properties.
- **Delete** (`DELETE /api/facilities/{id}`) — deletes a facility. Optional
  **Force Deletion** to cascade without pre-condition checks. Returns
  `{ "deleted": true }`.

### Order

- **Create** (`POST /api/orders`) — creates an order. Required: order date and
  one or more order line items (tenant article ID, title, quantity). Optional:
  tenant order ID, consumer (ID, email, addresses), status, custom attributes,
  and a raw-JSON field for advanced properties (delivery preferences, payment
  info, source, stickers, pricing).
- **Get** (`GET /api/orders/{id}`) — retrieves a single order. Select it **From
  list** or **By ID**. Supports **Simplify**.
- **Get Many** (`GET /api/orders`) — retrieves many orders with optional filters
  (tenant order ID, consumer ID), **Return All** / **Limit**, and **Simplify**.
- **Update** (`PATCH /api/orders/{id}`) — updates an order. Requires the current
  **Version** (optimistic locking — get it first with **Get**). Exposes comment,
  preferred handling time and custom attributes, plus a raw-JSON field for
  advanced properties (consumer, order line items, pricing).

### Carrier

- **Create** (`POST /api/carriers`) — creates a carrier. Required: key (the CEP
  integration, e.g. `DHL_V2`) and name. Optional: status, logo URL, product
  value needed, default parcel dimensions, plus a raw-JSON field for advanced
  properties (credentials, parcel label classifications).
- **Get** (`GET /api/carriers/{id}`) — retrieves a single carrier. Select it
  **From list** or **By ID**. Supports **Simplify**.
- **Get Many** (`GET /api/carriers`) — retrieves many carriers with **Return
  All** / **Limit** and **Simplify**.
- **Update** (`PATCH /api/carriers/{id}`) — updates a carrier. Requires the
  current **Version** (optimistic locking — get it first with **Get**). Exposes
  name, status, delivery type, lifecycle, logo URL, product value needed and
  default parcel dimensions, plus a raw-JSON field for advanced properties.

### Facility Carrier Connection

Connects a carrier to a facility (`/api/facilities/{facilityId}/carriers`). All
operations take a **Facility** (From list or by ID); get/create/update also take
a **Carrier**.

- **Create** (`POST …/carriers/{carrierRef}`) — connects a carrier to the
  facility. Optional: name, status, plus a raw-JSON field for advanced
  properties (configuration, credentials, cutoff times, delivery areas, valid
  delivery targets, parcel label classifications, tags).
- **Get** (`GET …/carriers/{carrierRef}`) — retrieves a single connection.
  Supports **Simplify**.
- **Get Many** (`GET …/carriers`) — retrieves all carrier connections of the
  facility. Supports **Simplify**.
- **Update** (`PUT …/carriers/{carrierRef}`) — updates a connection. Requires
  the current **Version** (optimistic locking — get it first with **Get**).
  Exposes name and status, plus a raw-JSON field for advanced properties.

## Trigger

The **fulfillmenttools Trigger** node starts a workflow when a tenant event is
delivered to its webhook. On activation it registers a `WEBHOOK` subscription in
fulfillmenttools (`POST /api/subscriptions`); on deactivation it removes the
subscription. Pick one **Event** to subscribe to and optionally name the
subscription.

Supported events span order, pick job, pack job, stow job, handover job,
shipment, parcel, routing plan, return, inventory/stock, listing, storage
location, inbound delivery/process, facility, facility group, service job,
expiry entity, external action, process, and user lifecycle events — see the
node's Event dropdown for the full list. See the
[fulfillmenttools eventing docs](https://docs.fulfillmenttools.com/documentation/getting-started/eventing)
for details.

> Webhook triggers need a callback URL reachable from fulfillmenttools. On n8n
> Cloud this is automatic. For local development, expose n8n with a public URL
> (the bundled `npm run dev:local` starts a Cloudflare tunnel and wires
> `WEBHOOK_URL`).

## Credentials

fulfillmenttools authenticates against **Google Identity Platform**. The node
exchanges your API user credentials for a short-lived JWT and sends it as a
`Bearer` token on every request. n8n refreshes the token automatically when it
expires.

Create a **fulfillmenttools API** credential with:

| Field            | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| API Base URL     | `https://<tenant>.api.fulfillmenttools.com` (no trailing slash)             |
| Auth Key         | The Google Identity Platform API key (`AUTHKEY`) provided for your tenant   |
| Username (Email) | Email address of the API user (e.g. `user@ocff-<tenant>-<env>.com`)         |
| Password         | Password of the API user                                                    |

n8n tests the credential by calling `GET /api/facilities`.

## Compatibility

Built and tested against the current n8n community node tooling
(`@n8n/node-cli`). Requires Node.js 20.15 or later.

## Development

This package uses the official [`n8n-node` CLI](https://docs.n8n.io/connect/create-nodes/build-your-node/using-the-n8n-node-tool):

```bash
npm install       # install dependencies
npm run dev       # official runner (starts n8n via npx n8n@latest)
npm run build     # compile + bundle assets into dist/
npm run lint      # run the n8n node lint rules (add :fix to autofix)
npm run release   # build, lint, changelog, tag and publish to npm
```

### Local run helper (`dev:local`)

If `npm run dev` fails to start n8n in your environment (recent Node versions
crash `npx n8n@latest`), use the bundled helper instead. In one command it:
links this package into n8n's custom-extensions folder, builds, watches
TypeScript for hot reload, starts a **Cloudflare tunnel**, and starts a
**globally-installed** n8n (`npm install -g n8n@1`) wired to the tunnel URL:

```bash
npm run dev:local                  # link + build + watch + tunnel + n8n
npm run dev:local:no-tunnel        # same, without the tunnel (action nodes only)
```

The tunnel (on by default) needs `cloudflared` (`brew install cloudflared`) and
gives fulfillmenttools a public callback URL so the Trigger node can receive
events. The URL is printed on startup and **changes each run** — re-activate
trigger workflows after restarting. If `cloudflared` isn't installed,
`dev:local` still starts n8n, just without the tunnel. Stop with `Ctrl+C`.

### Extending the package

Adding a new resource is a three-step pattern:

1. Add a description file under `nodes/Fulfillmenttools/descriptions/` exporting
   the resource's operations and fields (see `FacilityDescription.ts`).
2. Re-export it from `descriptions/index.ts` and register the resource option in
   `Fulfillmenttools.node.ts`.
3. Add a branch to the `execute` router that builds the request body and calls
   `fulfillmenttoolsApiRequest`.

All requests share the authenticated `fulfillmenttoolsApiRequest` helper in
`GenericFunctions.ts`.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [fulfillmenttools documentation](https://docs.fulfillmenttools.com/documentation)
- [fulfillmenttools API reference](https://github.com/fulfillmenttools/fulfillmenttools-api-reference)

## License

[MIT](LICENSE)
