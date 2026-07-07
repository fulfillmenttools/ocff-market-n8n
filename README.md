# n8n-nodes-fulfillmenttools

This is an [n8n](https://n8n.io) community node package for the
[fulfillmenttools](https://fulfillmenttools.com) REST API. It lets you manage
your fulfillmenttools tenant directly from n8n workflows.

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Development](#development) · [Resources](#resources)

## Installation

Follow the
[community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/)
and use the package name `n8n-nodes-fulfillmenttools`.

> Unverified community nodes can only be installed on self-hosted n8n. On n8n
> Cloud the package must first be published and verified by n8n.

## Operations

### Facility

- **Create** — creates a managed facility (`POST /api/facilities`). Required:
  name and address (company name, street, city, postal code, country). Optional:
  tenant facility ID, status, custom attributes, and additional address fields.

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
crash `npx n8n@latest`), use the bundled helper instead. It links this package
into n8n's custom-extensions folder, builds, watches TypeScript for hot reload,
and starts a **globally-installed** n8n (`npm install -g n8n@1`):

```bash
npm run dev:local     # start n8n at http://localhost:5678 (action nodes)
npm run dev:tunnel    # same, plus a Cloudflare tunnel so the Trigger can receive events
```

`dev:tunnel` requires `cloudflared` (`brew install cloudflared`) and prints a
public URL that fulfillmenttools can call back — re-activate trigger workflows
whenever the URL changes. Stop either with `Ctrl+C`.

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
