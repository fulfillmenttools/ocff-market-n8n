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
- **Search** (`POST /api/facilities/search`) — condition builder over the full
  `FacilitySearchQuery`: ID, name, tenant facility ID, status, type, location
  type, every address and contact field, service, tags, and the key of a
  connected carrier. Sort by name, status, type, location type, last modified,
  city/country/postal code, service or a custom attribute. See
  [Search operations](#search-operations).
- **Update** (`PATCH /api/facilities/{id}`) — updates a facility. Requires the
  current **Version** (optimistic locking — get it first with **Get**). Exposes
  the common scalar fields plus structured **Address**, **Contact**, **Tags**,
  **Picking Methods**, **Services**, **Picking Times**, **Scanning Rules** and
  **Closing Days** (the same widgets as Create), plus a raw-JSON field for
  advanced properties (configs).
- **Delete** (`DELETE /api/facilities/{id}`) — deletes a facility. Optional
  **Force Deletion** to cascade without pre-condition checks. Returns
  `{ "deleted": true }`.

### Order

- **Create** (`POST /api/orders`) — creates an order. Required: order date and
  one or more order line items (tenant article ID, title, quantity, plus
  optional scannable codes and custom attributes). Optional: tenant order ID,
  consumer (ID, email, addresses, facility ref, tenant facility ID, custom
  attributes), status, valid-until (promises), **Payment Info** (currency,
  localized method), **Tags**, **Status Reasons**, custom attributes, and a
  raw-JSON field for advanced properties (delivery preferences, source,
  stickers, custom services, pricing).
- **Get** (`GET /api/orders/{id}`) — retrieves a single order. Select it **From
  list** or **By ID**. Supports **Simplify**.
- **Get Many** (`GET /api/orders`) — retrieves many orders with optional filters
  (tenant order ID, consumer ID), **Return All** / **Limit**, and **Simplify**.
- **Search** (`POST /api/orders/search`) — condition builder over the full
  `OrderSearchQuery`: tenant order ID, status, order date, every consumer
  address field plus consumer ID, delivery preferences (collect facility ref
  and paid flag, desired delivery time, service level), order line item article
  ID/title, payment method and currency, and tags. Sort by order date or
  status. See [Search operations](#search-operations).
- **Update** (`PATCH /api/orders/{id}`) — updates an order. Requires the current
  **Version** (optimistic locking — get it first with **Get**). Exposes comment,
  preferred handling time, custom attributes, a structured **Consumer**, and
  **Order Line Items** (the sent set replaces all existing line items), plus a
  raw-JSON field for advanced properties (pricing).

### Carrier

- **Create** (`POST /api/carriers`) — creates a carrier. Required: key (the CEP
  integration, e.g. `DHL_V2`) and name. Optional: status, logo URL, product
  value needed, default parcel dimensions, structured **Parcel Label
  Classifications** (localized name, dimensions, bulky goods) and **Credentials**
  (key plus carrier-specific JSON values), plus a raw-JSON field for any further
  advanced properties.
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
  facility. Optional: name, status, structured **Valid Delivery Targets**,
  **Cutoff Time** (hour/minute), **Delivery Areas** (country/postal code),
  **Tags** and **Parcel Label Classifications** (localized name, dimensions,
  bulky goods), dedicated **Configuration** / **Credentials** JSON fields, plus a
  raw-JSON field for the remaining advanced properties (weekday cutoff times).
- **Get** (`GET …/carriers/{carrierRef}`) — retrieves a single connection.
  Supports **Simplify**.
- **Get Many** (`GET …/carriers`) — retrieves all carrier connections of the
  facility. Supports **Simplify**.
- **Update** (`PUT …/carriers/{carrierRef}`) — updates a connection. Requires
  the current **Version** (optimistic locking — get it first with **Get**).
  Exposes name, status and the same structured fields as Create (valid delivery
  targets, cutoff time, delivery areas, tags, parcel label classifications,
  configuration, credentials), plus a raw-JSON field for advanced properties.

### Handover Job

Handover jobs (`/api/handoverjobs`).

- **Get Many** (`GET /api/handoverjobs`) — retrieves many handover jobs with
  optional filters (search term, facility/pick-job/shipment ref, tenant order ID,
  assigned user, channel, carrier refs, status, anonymized, and a target-time
  range), **Return All** / **Limit**, and **Simplify**.
- **Get** (`GET /api/handoverjobs/{handoverjobId}`) — retrieves a single handover
  job. Supports **Simplify**.
- **Create** (`POST /api/handoverjobs`) — creates a handover job, covering the
  full non-deprecated `HandoverjobForCreation` schema. Required: **Facility**,
  **Channel** (delivery/collect), **Order Date**, **Target Time**. Three
  structured line-item collections — **Handover Job Line Items** (with handed-over
  quantity, status, refused/substitute JSON), **Expected** and **Missing** — each
  exposing the article (tenant ID, title, image URL, weight, title-localized,
  attributes), quantities, measurement units, scannable codes, tags, recordable
  attributes and custom attributes. Plus structured **Tags**, **Assigned Users**,
  **Transfers**, full **Invoice**/**Recipient** address collections, **Parcel
  Info** (carrier/parcel/shipment refs), **Workflow Information**, and scalar
  additional fields (identifiers, refs, status, cancel reason, paid, custom
  attributes), with JSON fields for stickers.
- **Search** (`POST /api/handoverjobs/search`) — condition builder over the full
  `HandoverJobSearchQuery`: ID, facility ref, status, channel, anonymized, full/
  short identifiers, tenant order ID, pick job ref, assigned users, invoice and
  recipient names/emails/companies, line item article ID/title, and parcel
  carrier/shipment refs. Sort by target time. See
  [Search operations](#search-operations).
- **Update** (`PATCH /api/handoverjobs/{handoverjobId}`) — updates a handover
  job. Requires the current **Version**. **Update Fields** (status, custom
  attributes) build a `ModifyHandoverjob` action; extra raw actions can be
  appended as JSON.

### Inbound

Inbound processes (`/api/inboundprocesses`).

- **Create** (`POST /api/inboundprocesses`) — creates an inbound process.
  Required: facility. Optional: tenant inbound process ID, on hold, scannable
  codes, custom attributes, a structured **Purchase Order** (order date,
  requested date, status, supplier) with **Purchase Order Line Items** (article,
  quantity), and a single **Receipt** (received date, status) with **Received
  Items** (article, accepted/rejected quantity). Multiple receipts remain
  available via the raw-JSON field.
- **Add Receipt** (`POST /api/inboundprocesses/{id}/receipts`) — adds a goods
  receipt to an inbound process: received date, status, ASN ref, comment, and
  received items (article, accepted/rejected quantity, storage location).
- **Get** (`GET /api/inboundprocesses/{id}`) — retrieves a single inbound
  process. Select it **From list** or **By ID**. Supports **Simplify**.
- **Get Many** (`GET /api/inboundprocesses`) — retrieves many inbound processes
  with optional filters (sort, status, facility ref, scannable code, search
  term), **Return All** / **Limit**, and **Simplify**.
- **Search** (`POST /api/inboundprocesses/search`) — condition builder over the
  full `InboundProcessSearchQuery`: ID, tenant inbound process ID, status,
  facility ref, inbound date, scannable codes, the purchase order (ID, status,
  order date, requested date and type, supplier name, transfer ID, article ID)
  and receipts (ID, status, received date). Sort by last modified, purchase
  order created/requested date/supplier, or a custom attribute. See
  [Search operations](#search-operations).
- **Update** (`PATCH /api/inboundprocesses/{id}`) — updates an inbound process.
  Requires the current **Version** (optimistic locking — get it first with
  **Get**). Exposes on hold, scannable codes and custom attributes. Returns the
  updated process.
- **Update Purchase Order** (`PUT /api/inboundprocesses/{id}/purchaseorder`) —
  creates or replaces the purchase order of an inbound process. Requires the
  current **Version** (optimistic locking — get it first with **Get**) and the
  same structured **Purchase Order** / **Purchase Order Line Items** fields as
  Create. Returns the updated process.
- **Delete** (`DELETE /api/inboundprocesses/{id}`) — deletes an inbound process.
  Returns `{ "deleted": true }`.

### Process

Covers the Processes (Core) endpoints. A process ties together the order, pick
jobs, shipments and returns that belong to one fulfillment. Operations that take
a **Process** offer it **From list** (searched by tenant order ID) or **By ID**.

- **Get** (`GET /api/processes/{processId}`) — retrieves a single process.
  Supports **Simplify**.
- **Get by Reference** (`GET /api/process`) — retrieves the process belonging to
  a **Reference Type** (tenant order ID, order, pick job, shipment, handover job
  or return ref) and its value. Supports **Simplify**.
- **Search** (`POST /api/processes/search`) — condition builder over the full
  `ProcessSearchQuery`: process ID, created date, all the entity refs (order,
  pick/pack/handover/service jobs, shipments, returns, routing plans, documents,
  external actions, flat refs), the status/operative/DOMS/inventory/return
  statuses, tags, a full-text **Search Term**, and cross-entity `referenced`
  filters (article ID, service type, target time). Sort by process ID, any
  status, active facility name/country, or referenced target time / parcel
  tracking status. See [Search operations](#search-operations).
- **Get History Logs** (`GET /api/processes/{processId}/historylogs`) — retrieves
  the process history with optional filters (type, username, facility name,
  order by, collapse consecutive duplicates) plus **Return All** / **Limit**.
- **Get Document** (`GET …/documents/{documentId}`) — retrieves the metadata of a
  document attached to the process. Both **Process** and **Document ID** are
  required, matching the endpoint's two path parameters; a process lists its
  documents under `documentRefs`.
- **Create Document** (`POST …/documents`) — attaches a document. Requires
  **Document Type** (PDF, PNG, JPG, GIF, JPEG, XML, JSON, ZPL) and **Section**
  (order, pick job, pack job, handover job, parcel, packing target container).
  The file is optional and comes from an input **Binary Field**, a **Base64
  String**, or is omitted entirely; **Priority** is available under Options.
- **Update Document File** (`PUT …/documents/{documentId}/file`) — replaces the
  file of a document. Requires the current **Version** (optimistic locking — get
  it first with **Get Document**) and a file from a binary field or base64.
- **Download Document File** — downloads the file as n8n binary data into the
  field named in **Put Output File in Field**. **Look Up By** picks the endpoint:
  *Process and Document* (`GET …/processes/{processId}/documents/{documentId}/file`)
  or *Document Only* (`GET /api/documents/{documentId}/file`). The two require
  different API permissions (`DOCUMENT_SET_READ` vs `PROCESS_READ`), so pick
  whichever your API user is granted. The output file name comes from the
  response's `content-disposition` header, falling back to the document ID plus
  an extension derived from the content type.

### Listing

Listings (`/api/facilities/{facilityId}/listings` and `/api/listings`). A listing
is uniquely identified by its facility plus `tenantArticleId`. Operations that
address a single facility offer it **From list** or **By ID**.

- **Get Many** (`GET …/facilities/{facilityId}/listings`) — retrieves the
  listings of a facility with an optional **Tenant Article IDs** filter,
  **Return All** / **Limit**, and **Simplify**.
- **Get** (`GET …/listings/{tenantArticleId}`) — retrieves a single listing.
  Optional **Locale** resolves localized fields. Supports **Simplify**.
- **Search** (`POST /api/listings/search`) — condition builder over the full
  `ListingSearchQuery`: ID, tenant article ID, facility ref, status, out-of-stock
  behaviour, price and weight (numeric operators), measurement unit key, category
  refs, tags, created and availability-timeframe dates. Sort by tenant article
  ID, last modified, or a custom attribute. See [Search operations](#search-operations).
- **Update** (`PATCH …/listings/{tenantArticleId}`) — updates a single listing.
  Requires the current **Version** (optimistic locking — get it first with
  **Get**). The **Update Fields** collection is wrapped in one `ModifyListing`
  action; extra raw actions can be appended as JSON.
- **Create and Update per Facility** (`PUT …/facilities/{facilityId}/listings`) —
  creates or replaces the listings of one facility. The **Listings** collection
  takes one entry per listing (tenant article ID required, plus the shared
  fields and an optional version).

  Every listing (here and in **Create and Update** and **Update**) exposes the
  full non-deprecated `ListingForCreation` schema as proper form fields: scalars
  (title, status, image URL, measurement unit key, out-of-stock behaviour, legal
  HS code), comma-separated lists (category refs, scannable codes), structured
  **Tags** (ID + value), **Title Localized** (locale + value translations),
  **Attributes** (key, value, type, category, priority), **Scanning Rules**
  (type + priority), **Stock Properties** (key, input type, required, default),
  **Recordable Attributes** (localized key, recording rule, value — not on bulk),
  **Stock Available Until** (calculation base + modifier), and the Alpha
  out-of-stock config (preorder availability start, restockable-in-days, plus a
  JSON field for the by-context behaviours). **Custom Attributes** stays JSON (it
  is free-form), and an **Additional Fields (JSON)** hatch covers anything else.
- **Create and Update** (`PUT /api/listings`) — bulk upserts listings independent
  of facility. Each **Listings** entry needs a tenant article ID and title, and a
  **Targeting Strategy**: *Single Facility* (a facility ref or tenant facility ID
  plus optional version) or *Multi Selector* (a JSON array of facility selectors).
  Entries times selectors must not exceed 25.
- **Delete** (`DELETE …/listings/{tenantArticleId}`) — deletes a single listing.
  Returns `{ "deleted": true }`.

### Pick Job

Picking (Operations) endpoints — pick jobs, their delivery notes, and pick runs.

- **Get Many** (`GET /api/pickjobs`) — retrieves many pick jobs with optional
  filters (search term, facility/order ref, tenant order ID, assigned user,
  consumer name, channel, status, and order-date / target-time ranges),
  **Return All** / **Limit**, and **Simplify**.
- **Get** (`GET /api/pickjobs/{pickJobId}`) — retrieves a single pick job.
  Supports **Simplify**.
- **Create** (`POST /api/pickjobs`) — creates a pick job, covering the full
  non-deprecated `PickJobForCreation` schema. Required: **Facility**, **Order
  Date**, and one or more **Pick Line Items**. Each line item exposes the article
  (tenant ID, title, image URL, weight, structured **Title Localized** and
  **Article Attributes**), quantity and secondary quantity, measurement unit keys,
  global line item ID, scannable codes, structured **Tags** and **Recordable
  Attributes**, and dedicated JSON fields for the deep structures (allowed
  substitutes, partial stock locations, measurement validation, stickers).
  Top-level: order/tenant-order refs, short ID, status, operative process ref,
  routing plan ref, process ID, preferred picking methods, payment currency,
  picking start-latest-at, custom attributes, structured **Tags**, **Assigned
  Users** (by ID or username) and **Transfers**, plus named JSON fields for
  **Delivery Information**, **Expected Pick Line Items**, **Stickers** and
  **Workflow Information**.
- **Search** (`POST /api/pickjobs/search`) — condition builder over the full
  `PickJobSearchQuery`: ID, facility/order ref, tenant order ID, consumer name,
  status, preferred picking method, tenant article ID, transfer ID, and the
  created / last-modified / target-time dates. Sort by created, last modified,
  target time or tenant order ID. See [Search operations](#search-operations).
- **Get Delivery Note** (`GET /api/pickjobs/{pickJobId}/deliverynote`) —
  downloads the delivery-note PDF as n8n binary data into the field named in
  **Put Output File in Field**. Optional **Locale**.
- **Get Pick Run** (`GET /api/pickruns/{pickRunId}`) — retrieves a single pick
  run.
- **Create Pick Run** (`POST /api/pickruns`) — creates a pick run. Required:
  **Facility** and comma-separated **Pick Job Refs**. Optional pick run type
  (batch / multi order) and status.
- **Update Pick Run** (`PATCH /api/pickruns/{pickRunId}`) — modifies pick-run
  line items. Requires the current **Version**; each **Line Item Modification**
  (line item ID, picked / secondary-picked quantities, status) becomes a
  `ModifyPickRunLineItem` action, and extra raw actions can be appended as JSON.
- **Update Pick Run Pick Jobs** (`PATCH /api/pickruns/{pickRunId}/pickjobs`) —
  removes a pick job from a pick run. Requires the current **Version** and the
  **Pick Job Ref to Remove**; returns the updated pick run.

### Pack Job

Packing (Operations) endpoints — pack jobs and their documents.

- **Get Many** (`GET /api/packjobs`) — retrieves many pack jobs with optional
  filters (search term, facility/order/pick-job ref, process ID, tenant order ID,
  short ID, article title, assigned/modified-by user, channel, source container
  codes, status, anonymized, and order-date / target-time ranges), **Return All**
  / **Limit**, and **Simplify**.
- **Get** (`GET /api/packjobs/{packJobId}`) — retrieves a single pack job.
  Supports **Simplify**.
- **Create** (`POST /api/packjobs`) — creates a pack job, covering the full
  non-deprecated `PackJobForCreation` schema. Required: **Facility**, one or more
  **Line Items**, and **Workflow Information** (defaults to not part of a
  workflow). Each line item exposes the article (tenant ID, title, image URL,
  weight, structured **Title Localized** and **Article Attributes**, custom
  attributes), quantities and measurement units, global line item ID, scannable
  codes, service job refs, structured **Tags** and **Recordable Attributes**, and
  JSON fields for stickers. Top-level: order/pick-job/process refs, tenant order
  ID, short ID, recipient name, status, delivery channel, order date, target time,
  operative process ref, custom attributes, structured **Tags**, **Assigned
  Users**, **Transfers**, and full **Invoice**/**Recipient** address collections
  (street, city, coordinates, phone numbers, etc.).
- **Search** (`POST /api/packjobs/search`) — condition builder over the full
  `PackJobSearchQuery`: ID, facility ref, status, short ID, tenant order ID,
  invoice and recipient names/emails/companies, line item article ID/title,
  packing source container codes, and order-date / last-modified / target-time
  dates. Sort by last modified, order date or target time. See
  [Search operations](#search-operations).
- **Update** (`PATCH /api/packjobs/{packJobId}`) — updates a pack job. Requires
  the current **Version**. **Update Fields** (status, custom attributes) build a
  `ModifyPackJob` action; **Line Item Modifications** (line item ID + packed)
  build `ModifyPackLineItem` actions; **Pause Pack Job** adds a `PausePackJob`
  action with optional packed-amount updates; and extra raw actions can be
  appended as JSON.
- **Get Delivery Note** (`GET …/deliverynote`), **Get Return Note**
  (`GET …/returnnote`), **Get Transfer Label** (`GET …/transferlabel`) — download
  the respective PDF as n8n binary data into the field named in **Put Output File
  in Field**.

### Shipment

Covers both parcels and shipments (Shipping endpoints). All PDF downloads land in
the binary field named in **Put Output File in Field**.

Parcels:

- **List Parcels** (`GET /api/parcels`) — retrieves many parcels with **Return
  All** / **Limit** and **Simplify**.
- **Get Parcel** (`GET /api/parcels/{parcelId}`) — retrieves a single parcel.
- **Create Parcel** (`POST /api/shipments/parcels`) — creates a standalone
  parcel, covering the full non-deprecated `ParcelForCreation` schema: **Items**
  (article + description), structured **Invoice**/**Recipient** addresses,
  **Dimensions**, **Services** (11 flags), **Pick-Up Information**, **Transfers**,
  scalar fields (carrier ref/product, product value + currency + type, payment
  currency, short ID, status, tenant/parcel IDs, load unit refs, shipping
  container number), and JSON fields for sender, return address and result.
- **Create Shipment Parcel** (`POST /api/shipments/{shipmentId}/parcels`) — the
  same parcel fields for an existing shipment (carrier ref is ignored here).
- **Update Parcel** (`PATCH /api/parcels/{parcelId}`) — `ModifyParcel` (status,
  carrier product, product values, dimensions, services, pick-up info, result)
  plus a `ModifyParcelLoadUnit` action from **Load Unit Refs**; extra raw actions
  as JSON.
- **Search Parcels** (`POST /api/parcels/search`) — condition builder over
  `ParcelSearchQuery` (ID, carrier/facility/shipment refs, status, short ID,
  tenant order ID, invoice/recipient names, item article, carrier tracking
  number, dates). See [Search operations](#search-operations).
- **Get Parcel Delivery Note / Label / Return Note / Transfer Label**
  (`GET /api/parcels/{parcelId}/{deliverynote|labels/{type}|returnnote|transferlabel}`)
  — PDF downloads. The label operation adds a **Label Document** picker (send /
  return / customs / all, PDF or ZPL).

Shipments:

- **List Shipments** (`GET /api/shipments`) — retrieves many shipments with
  filters (search term, facility/carrier/pick-job refs, carrier keys, status,
  parcel status, tenant order ID, target-time range, anonymized), **Return All**
  / **Limit** and **Simplify**.
- **Get Shipment** (`GET /api/shipments/{shipmentId}`) — retrieves a single
  shipment.
- **Create Shipment** (`POST /api/shipments`) — creates a shipment, covering the
  full non-deprecated `ShipmentForCreation` schema: required facility, order date
  and target time; **Line Items** (article, tags, recordable attributes),
  structured **Invoice**/**Postal**/**Target** addresses, **Transfers**, **Tags**,
  scalar fields, and JSON fields for source address and carrier services.
- **Update Shipment** (`PATCH /api/shipments/{shipmentId}`) — `ModifyShipment`
  (status, carrier ref/product, pick job ref, payment currency, target address);
  extra raw actions as JSON.
- **Search Shipments** (`POST /api/shipments/search`) — condition builder over
  `ShipmentSearchQuery` (ID, carrier key/ref, facility/pick-job refs, status,
  parcel status, tenant order ID, anonymized, dates). See
  [Search operations](#search-operations).
- **Get Shipment Delivery Note** (`GET /api/shipments/{shipmentId}/deliverynote`)
  — PDF download.

Return notes:

- **Create Return Note** (`POST /api/returnnotes`) — required order information
  and **Items** (title, quantity, substitutes); optional company and delivery
  addresses, QR code content, and a JSON field for typed delivery addresses.

### Return

Item return jobs and item returns (Returns (Operations) endpoints).

- **List Item Return Jobs** (`GET /api/itemreturnjobs`) — retrieves many item
  return jobs with filters (facility ID, job/return scannable codes, job/return
  status, search term, anonymized), **Return All** / **Limit** and **Simplify**.
- **Create Item Return Job** (`POST /api/itemreturnjobs`) — creates an item
  return job, covering the full `ItemReturnJobForCreation` schema. Required:
  **Origin Facility Refs**, **Status**, at least one **Consumer Address**, and at
  least one **Returnable Line Item**. Line items expose the article (tenant ID,
  title, image URL, weight, localized title, attributes), delivered quantity,
  global line item ID, scannable codes, service job refs and recordable
  attributes. Also **Not Returnable Line Items** and scalar fields.
- **List Item Returns** (`GET …/{jobId}/itemreturns`) — retrieves the item
  returns of a job. Supports **Simplify**.
- **Create Item Return** (`POST …/{jobId}/itemreturns`) — adds an item return.
  Requires the current **Item Return Job Version**, **Return Facility Ref**,
  **Status**, and **Returned Line Items** (line item ref, status, tenant article
  ID, localized item condition, decision reason, scanned codes, recordable
  attributes, and a JSON field for reasons).
- **Get Item Return** (`GET …/itemreturns/{itemReturnId}`) — retrieves a single
  item return. Supports **Simplify**.
- **Update Returned Line Items** (`PUT …/returnedlineitems`) — replaces the
  returned line items of an item return. Requires the job version and the same
  **Returned Line Items** collection.
- **Update Returned Line Item** (`PATCH …/returnedlineitems/{id}`) — updates a
  single returned line item. Requires the job version; **Update Fields** exposes
  status, localized decision reason + comment, and a refund (status plus either a
  percent or a value + currency).
- **Get Item Returns** (`GET /api/itemreturns`) — retrieves many item returns
  across jobs with filters (search term, item-return and line-item status, order
  by, facility refs, anonymized), **Return All** / **Limit** and **Simplify**.

### Routing Plan

Routing plans (Routing Plans (DOMS) endpoints). All read-only.

- **List** (`GET /api/routingplans`) — retrieves routing plans, optionally
  filtered by an **Order Ref**. Supports **Simplify**.
- **Get** (`GET /api/routingplans/{id}`) — retrieves a single routing plan by ID.
  Supports **Simplify**.
- **Search** (`POST /api/routingplans/search`) — condition builder over the full
  `RoutingPlanSearchQuery`: order/pick-job refs, process ID, priority, split
  count, reroute reason, status, order date, provisioning time, delivery
  preferences (collect facility/paid, preferred/supplying facilities, target
  time), earliest/latest picking start (carrier ref + date), order line item ID,
  target address (city/country/province/street) and history created date. Sort by
  order date/ref, process ID, provisioning time, status or anonymized. See
  [Search operations](#search-operations).
- **List Graphs** (`GET /api/routingplansgraph`) — retrieves the routing plans
  graph (`{ nodes, edges }`) for a process, optionally filtered by a **Process
  Ref**.

### Service

Covers service jobs and linked service jobs (Services endpoints).

- **List Service Jobs** (`GET /api/servicejobs`) — retrieves many service jobs
  with filters (facility ref, status, channel, target-time range, order by,
  search term, assigned user), **Return All** / **Limit** and **Simplify**.
- **Get Service Job** (`GET /api/servicejobs/{serviceJobId}`) — retrieves a
  single service job.
- **Create Service Job** (`POST /api/servicejobs`) — creates a service job,
  covering the full `ServiceJobForCreation` schema. Required: **Facility** and
  **Target Time**. Structured **Line Items** and **Required Line Items** (article,
  quantities, measurement units, recordable attributes), **Additional
  Information** (ref/tenant ref + typed value), **Assigned Users**, and scalar
  fields (custom service ref, tenant custom service ID, service job link ref,
  process refs, short ID, tenant order ID, custom attributes).
- **List Linked Service Jobs** (`GET /api/linkedservicejobs`) — retrieves many
  linked service jobs groups with filters (facility IDs, status, channel,
  target-time range, order by, search term, modified-by user), **Return All** /
  **Limit** and **Simplify**.
- **Get Linked Service Jobs** (`GET /api/linkedservicejobs/{id}`) — retrieves a
  single group.
- **Create Service Job Link** (`POST …/{id}/servicejoblinks`) — adds a service
  job (by **Service Job Ref**) to a linked service jobs group.
- **Create Nested Service Job Link** (`POST …/{id}/servicejoblinks/{linkId}`) —
  adds a service job link nested under an existing link.
- **Search Linked Service Jobs** (`POST /api/linkedservicejobs/search`) —
  condition builder over `LinkedServiceJobsSearchQuery` (ID, facility ref,
  status, channel, consumer name, invoice/shipping address, article titles,
  service name, additional information, linked ref, tenant order ID, last
  modified, target time). See [Search operations](#search-operations).

Custom services:

- **List Custom Services** (`GET /api/customservices`) — retrieves many custom
  services with an optional **Tenant Custom Service ID** filter, **Return All** /
  **Limit** and **Simplify**.
- **Get Custom Service** (`GET /api/customservices/{id}`) — retrieves a single
  custom service.
- **Create Custom Service** (`POST /api/customservices`) — creates a custom
  service, covering the full `CustomServiceForCreation` schema. Required:
  localized **Name**, **Status** (active/inactive), and **Items Required**
  (mandatory/none). Optional localized **Description**, structured **Additional
  Information** (localized name/description, value type, mandatory flag, tenant
  ID), execution time, image refs, items-returnable flag, tenant custom service
  ID and custom attributes.
- **Update Custom Service** (`PATCH /api/customservices/{id}`) — updates a custom
  service (via `CustomServiceForUpdate`). Requires the current **Version**;
  **Update Fields** exposes localized name/description, status, items required,
  items returnable, execution time, tenant custom service ID and custom
  attributes.
- **List Facility Custom Services** (`GET /api/facilities/{facilityId}/customservices`)
  — retrieves the custom services connected to a facility, with **Return All** /
  **Limit** and **Simplify**.
- **Get Facility Custom Service**
  (`GET /api/facilities/{facilityId}/customservices/{customServiceId}`) —
  retrieves a single facility custom service connection.

## Search operations

Facility, Order, Inbound, Process, Listing, Pick Job, Pack Job, Handover Job,
Shipment (parcels and shipments), Service (linked service jobs) and Routing Plan
each have a **Search** operation backed by the fulfillmenttools search API
(`POST /api/{entity}/search`), which is far more expressive than the fixed **Get
Many** filters. They share the
same UI:

- **Match** — whether results must satisfy all conditions (`and`) or any of them
  (`or`).
- **Conditions** — repeatable **Field → Operator → Value** rows. The field list
  is the resource's full queryable schema, and both the operator list and the
  value widget adapt to the field you pick:

  | Field type       | Operators                                                            | Value widget    |
  | ---------------- | -------------------------------------------------------------------- | --------------- |
  | Text             | Equals, Not Equals, Is One Of, Is Not One Of                          | text            |
  | Text (searchable)| the above plus Matches Regex                                          | text            |
  | Fixed values     | Equals, Not Equals, Is One Of                                         | multi-select    |
  | Full-text        | Matches Regex                                                         | text            |
  | True/false       | Equals, Not Equals                                                    | toggle          |
  | Number           | Equals, Not Equals, Is One Of, Is Not One Of, Greater/Less Than (or Equal) | text       |
  | Date             | Equals, Not Equals, Before, After, On or Before, On or After, Relative | date or `-P1D`  |

  For **Is One Of** / **Is Not One Of**, separate text values with commas. The
  relative date operators take an ISO-8601 duration relative to now (`-P1D` for
  yesterday, `P1W` for next week).
- **Custom Attribute Conditions** — query free-form `customAttributes` by name,
  with a type (string, number, boolean, date) and a comparison operator. Names
  containing a period or starting with `$` are rejected, as the API requires.
  Not shown for Process, whose query schema has no custom attributes.
- **Sort** — one sort rule (field + direction), which is all the API accepts.
- **Return All** / **Limit** — results are cursor-paginated via
  `pageInfo.endCursor` behind the scenes; **Limit** stops early.
- **Simplify** — same reduced output as **Get** / **Get Many**.
- **Additional Query Fields (JSON)** — raw JSON merged into the query for
  anything not exposed above, such as nested `and` / `or` groups or map-valued
  filters (stock properties, localized titles).

Unsupported operator/field combinations (for example Matches Regex on a field
the API models as an exact-match string) are rejected before the request with an
error naming the parameter.

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
`GenericFunctions.ts`. For list endpoints use `fulfillmenttoolsApiRequestAllItems`
(`startAfterId` paging); for the `POST /api/{entity}/search` endpoints use
`fulfillmenttoolsSearchRequest`, which handles the `pageInfo.endCursor` cursor
paging and an optional result limit.

Binary downloads (the `…/file` endpoints) use `fulfillmenttoolsApiRequestFile`,
which returns the raw bytes plus the response headers so the caller can build
n8n binary data with a sensible file name and MIME type.

Adding a **Search** operation to a resource needs no new UI or request code:
describe its queryable fields and sort keys once in `SearchConfigs.ts`, then
export `createSearchFields(<config>)` from `descriptions/SearchDescription.ts`
and register the config in `searchConfigs`. `SearchFunctions.ts` turns the same
registry into the request body, and the node's `execute` router dispatches every
`search` operation through it.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [fulfillmenttools documentation](https://docs.fulfillmenttools.com/documentation)
- [fulfillmenttools API reference](https://github.com/fulfillmenttools/fulfillmenttools-api-reference)

## License

[MIT](LICENSE)
