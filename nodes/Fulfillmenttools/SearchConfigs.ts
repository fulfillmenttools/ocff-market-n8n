import type { SearchResourceConfig } from './SearchFunctions';

/**
 * Queryable fields and sort keys of each fulfillmenttools search endpoint
 * (`POST /api/{entity}/search`), transcribed from the OpenAPI `*SearchQuery` and
 * `*Sort` schemas.
 *
 * These configs drive both the node UI (see `descriptions/SearchDescription.ts`)
 * and the request body builder (see `SearchFunctions.ts`), so a field only ever
 * has to be described once. Fields the API models as free-form maps (stock
 * properties, localized titles) are intentionally left out — the "Additional
 * Query Fields (JSON)" parameter covers them.
 */

/** `ProcessStatus`, shared by every status filter of `ProcessSearchQuery`. */
const PROCESS_STATUS_OPTIONS = [
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Created', value: 'CREATED' },
	{ name: 'Error', value: 'ERROR' },
	{ name: 'Finished', value: 'FINISHED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Not Available', value: 'NOT_AVAILABLE' },
];

/** `ListingStatus`, shared by the listing search and write operations. */
export const LISTING_STATUS_OPTIONS = [
	{ name: 'Active', value: 'ACTIVE' },
	{ name: 'Inactive', value: 'INACTIVE' },
];

/** `OutOfStockBehaviour`, shared by the listing search and write operations. */
export const OUT_OF_STOCK_BEHAVIOUR_OPTIONS = [
	{ name: 'Backorder', value: 'BACKORDER' },
	{ name: 'None', value: 'NONE' },
	{ name: 'Preorder', value: 'PREORDER' },
	{ name: 'Preorder and Restock', value: 'PREORDER_AND_RESTOCK' },
	{ name: 'Restock', value: 'RESTOCK' },
];

/** `PickJobStatus`, shared by the pickjob search and other pickjob fields. */
export const PICKJOB_STATUS_OPTIONS = [
	{ name: 'Aborted', value: 'ABORTED' },
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Closed', value: 'CLOSED' },
	{ name: 'Expired', value: 'EXPIRED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Open', value: 'OPEN' },
	{ name: 'Paused', value: 'PAUSED' },
	{ name: 'Picked', value: 'PICKED' },
	{ name: 'Rejected', value: 'REJECTED' },
	{ name: 'Rerouted', value: 'REROUTED' },
	{ name: 'Restowed', value: 'RESTOWED' },
	{ name: 'Waiting For Input', value: 'WAITING_FOR_INPUT' },
];

/** `PackJobStatus`, shared by the packjob search and write operations. */
export const PACKJOB_STATUS_OPTIONS = [
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Closed', value: 'CLOSED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Open', value: 'OPEN' },
	{ name: 'Paused', value: 'PAUSED' },
];

/** `HandoverjobStatus`, shared by the handover search and write operations. */
export const HANDOVER_STATUS_OPTIONS = [
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Handed Over', value: 'HANDED_OVER' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Open', value: 'OPEN' },
	{ name: 'Waiting For Input', value: 'WAITING_FOR_INPUT' },
];

/** `HandoverjobChannel`, shared by the handover search and write operations. */
export const HANDOVER_CHANNEL_OPTIONS = [
	{ name: 'Collect', value: 'COLLECT' },
	{ name: 'Delivery', value: 'DELIVERY' },
];

/** `ParcelStatus`, shared by the parcel search and write operations. */
export const PARCEL_STATUS_OPTIONS = [
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Done', value: 'DONE' },
	{ name: 'Failed', value: 'FAILED' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Open', value: 'OPEN' },
	{ name: 'Processing', value: 'PROCESSING' },
	{ name: 'Waiting For Input', value: 'WAITING_FOR_INPUT' },
];

/** `ShipmentStatus`, shared by the shipment search and write operations. */
export const SHIPMENT_STATUS_OPTIONS = [
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Completed', value: 'COMPLETED' },
	{ name: 'Confirmed', value: 'CONFIRMED' },
	{ name: 'Initial', value: 'INITIAL' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Request', value: 'REQUEST' },
	{ name: 'Retryable', value: 'RETRYABLE' },
];

/** `ServiceJobStatus`, used by the List Service Jobs filters. */
export const SERVICE_JOB_STATUS_OPTIONS = [
	{ name: 'Cancelled', value: 'CANCELLED' },
	{ name: 'Finished', value: 'FINISHED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Not Ready', value: 'NOT_READY' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Open', value: 'OPEN' },
	{ name: 'Waiting For Input', value: 'WAITING_FOR_INPUT' },
];

/** `LinkedServiceJobsStatus`, used by the linked service jobs list + search. */
export const LINKED_SERVICE_JOB_STATUS_OPTIONS = [
	{ name: 'Cancelled', value: 'CANCELLED' },
	{ name: 'Finished', value: 'FINISHED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Not Ready', value: 'NOT_READY' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Open', value: 'OPEN' },
];

/** Delivery channel, shared by the service list + search. */
export const SERVICE_CHANNEL_OPTIONS = [
	{ name: 'Collect', value: 'COLLECT' },
	{ name: 'Shipping', value: 'SHIPPING' },
];

/** `ProductValueType`, used by the parcel create operations. */
export const PRODUCT_VALUE_TYPE_OPTIONS = [
	{ name: 'Customs', value: 'CUSTOMS' },
	{ name: 'Insurance', value: 'INSURANCE' },
	{ name: 'Shop Price', value: 'SHOP_PRICE' },
];

/** `RoutingPlanStatus`, used by the routing plan search. */
export const ROUTING_PLAN_STATUS_OPTIONS = [
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Failed', value: 'FAILED' },
	{ name: 'Failed Reroute', value: 'FAILED_REROUTE' },
	{ name: 'Fallback Routing', value: 'FALLBACK_ROUTING' },
	{ name: 'In Preparation', value: 'IN_PREPARATION' },
	{ name: 'Initial', value: 'INITIAL' },
	{ name: 'Manual Planned', value: 'MANUAL_PLANNED' },
	{ name: 'Not Routable', value: 'NOT_ROUTABLE' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Planned', value: 'PLANNED' },
	{ name: 'Prioritized', value: 'PRIORITIZED' },
	{ name: 'Proposed', value: 'PROPOSED' },
	{ name: 'Redundant Reroute', value: 'REDUNDANT_REROUTE' },
	{ name: 'Retryable', value: 'RETRYABLE' },
	{ name: 'Routed', value: 'ROUTED' },
	{ name: 'Routing', value: 'ROUTING' },
	{ name: 'Waiting', value: 'WAITING' },
];

/** `FacilitySearchQuery` / `FacilitySort`. */
export const facilitySearchConfig: SearchResourceConfig = {
	resource: 'facility',
	endpoint: '/api/facilities/search',
	propertyName: 'facilities',
	fields: [
		{ name: 'Address: City', value: 'address.city', kind: 'search', path: ['address', 'city'] },
		{
			name: 'Address: Company Name',
			value: 'address.companyName',
			kind: 'string',
			path: ['address', 'companyName'],
		},
		{
			name: 'Address: Country',
			value: 'address.country',
			kind: 'search',
			path: ['address', 'country'],
			description: 'Two-letter country code as per ISO 3166-1 alpha-2, e.g. DE',
		},
		{
			name: 'Address: Email Address',
			value: 'address.emailAddresses.value',
			kind: 'string',
			path: ['address', 'emailAddresses', 'contains', 'value'],
		},
		{
			name: 'Address: Email Recipient',
			value: 'address.emailAddresses.recipient',
			kind: 'string',
			path: ['address', 'emailAddresses', 'contains', 'recipient'],
		},
		{
			name: 'Address: House Number',
			value: 'address.houseNumber',
			kind: 'string',
			path: ['address', 'houseNumber'],
		},
		{
			name: 'Address: Postal Code',
			value: 'address.postalCode',
			kind: 'search',
			path: ['address', 'postalCode'],
		},
		{
			name: 'Address: Province',
			value: 'address.province',
			kind: 'string',
			path: ['address', 'province'],
		},
		{ name: 'Address: Street', value: 'address.street', kind: 'string', path: ['address', 'street'] },
		{
			name: 'Carrier Key',
			value: 'referenced.facilityCarrierConnection.carrierKey',
			kind: 'string',
			path: ['referenced', 'facilityCarrierConnection', 'carrierKey'],
			topLevelOnly: true,
			description:
				'Key of a carrier connected to the facility. Cross-entity filters are always combined with AND, regardless of the Match setting.',
		},
		{
			name: 'Contact: First Name',
			value: 'contact.firstName',
			kind: 'string',
			path: ['contact', 'firstName'],
		},
		{
			name: 'Contact: Last Name',
			value: 'contact.lastName',
			kind: 'string',
			path: ['contact', 'lastName'],
		},
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{
			name: 'Location Type',
			value: 'locationType',
			kind: 'enum',
			path: ['locationType'],
			enumOptions: [
				{ name: 'External', value: 'EXTERNAL' },
				{ name: 'Store', value: 'STORE' },
				{ name: 'Warehouse', value: 'WAREHOUSE' },
			],
		},
		{ name: 'Name', value: 'name', kind: 'search', path: ['name'] },
		{
			name: 'Service',
			value: 'services.type',
			kind: 'enum',
			path: ['services', 'contains', 'type'],
			enumOptions: [
				{ name: 'Pickup', value: 'PICKUP' },
				{ name: 'Ship From Store', value: 'SHIP_FROM_STORE' },
			],
		},
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: [
				{ name: 'Offline', value: 'OFFLINE' },
				{ name: 'Online', value: 'ONLINE' },
				{ name: 'Suspended', value: 'SUSPENDED' },
			],
		},
		{ name: 'Tag ID', value: 'tags.id', kind: 'string', path: ['tags', 'contains', 'id'] },
		{ name: 'Tag Value', value: 'tags.value', kind: 'string', path: ['tags', 'contains', 'value'] },
		{
			name: 'Tenant Facility ID',
			value: 'tenantFacilityId',
			kind: 'string',
			path: ['tenantFacilityId'],
		},
		{
			name: 'Type',
			value: 'type',
			kind: 'enum',
			path: ['type'],
			enumOptions: [
				{ name: 'Managed Facility', value: 'MANAGED_FACILITY' },
				{ name: 'Supplier', value: 'SUPPLIER' },
			],
		},
	],
	sortFields: [
		{ name: 'Address: City', value: 'address.city', path: ['address', 'city'] },
		{ name: 'Address: Country', value: 'address.country', path: ['address', 'country'] },
		{ name: 'Address: Postal Code', value: 'address.postalCode', path: ['address', 'postalCode'] },
		{ name: 'Custom Attribute', value: 'customAttributes' },
		{ name: 'ID', value: 'id', path: ['id'] },
		{ name: 'Last Modified', value: 'lastModified', path: ['lastModified'] },
		{ name: 'Location Type', value: 'locationType', path: ['locationType'] },
		{ name: 'Name', value: 'name', path: ['name'] },
		{ name: 'Service', value: 'services.type', path: ['services', 'type'] },
		{ name: 'Status', value: 'status', path: ['status'] },
		{ name: 'Tenant Facility ID', value: 'tenantFacilityId', path: ['tenantFacilityId'] },
		{ name: 'Type', value: 'type', path: ['type'] },
	],
};

/** `OrderSearchQuery` / `OrderSort`. */
export const orderSearchConfig: SearchResourceConfig = {
	resource: 'order',
	endpoint: '/api/orders/search',
	propertyName: 'orders',
	fields: [
		{
			name: 'Consumer Address: City',
			value: 'consumer.addresses.city',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'city'],
		},
		{
			name: 'Consumer Address: Company Name',
			value: 'consumer.addresses.companyName',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'companyName'],
		},
		{
			name: 'Consumer Address: Country',
			value: 'consumer.addresses.country',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'country'],
			description: 'Two-letter country code as per ISO 3166-1 alpha-2, e.g. DE',
		},
		{
			name: 'Consumer Address: Email',
			value: 'consumer.addresses.email',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'email'],
		},
		{
			name: 'Consumer Address: First Name',
			value: 'consumer.addresses.firstName',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'firstName'],
		},
		{
			name: 'Consumer Address: House Number',
			value: 'consumer.addresses.houseNumber',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'houseNumber'],
		},
		{
			name: 'Consumer Address: Last Name',
			value: 'consumer.addresses.lastName',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'lastName'],
		},
		{
			name: 'Consumer Address: Postal Code',
			value: 'consumer.addresses.postalCode',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'postalCode'],
		},
		{
			name: 'Consumer Address: Province',
			value: 'consumer.addresses.province',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'province'],
		},
		{
			name: 'Consumer Address: Street',
			value: 'consumer.addresses.street',
			kind: 'string',
			path: ['consumer', 'addresses', 'contains', 'street'],
		},
		{
			name: 'Consumer Address: Type',
			value: 'consumer.addresses.addressType',
			kind: 'enum',
			path: ['consumer', 'addresses', 'contains', 'addressType'],
			enumOptions: [
				{ name: 'Invoice Address', value: 'INVOICE_ADDRESS' },
				{ name: 'Parcel Locker', value: 'PARCEL_LOCKER' },
				{ name: 'Postal Address', value: 'POSTAL_ADDRESS' },
			],
		},
		{
			name: 'Consumer ID',
			value: 'consumer.consumerId',
			kind: 'string',
			path: ['consumer', 'consumerId'],
		},
		{
			name: 'Delivery: Collect Facility Ref',
			value: 'deliveryPreferences.collect.facilityRef',
			kind: 'string',
			path: ['deliveryPreferences', 'collect', 'contains', 'facilityRef'],
		},
		{
			name: 'Delivery: Collect Paid',
			value: 'deliveryPreferences.collect.paid',
			kind: 'boolean',
			path: ['deliveryPreferences', 'collect', 'contains', 'paid'],
		},
		{
			name: 'Delivery: Desired Delivery Time',
			value: 'deliveryPreferences.shipping.desiredDeliveryTime',
			kind: 'date',
			path: ['deliveryPreferences', 'shipping', 'desiredDeliveryTime'],
		},
		{
			name: 'Delivery: Service Level',
			value: 'deliveryPreferences.shipping.serviceLevel',
			kind: 'enum',
			path: ['deliveryPreferences', 'shipping', 'serviceLevel'],
			enumOptions: [
				{ name: 'Delivery', value: 'DELIVERY' },
				{ name: 'Same Day', value: 'SAMEDAY' },
			],
		},
		{
			name: 'Line Item: Article ID',
			value: 'orderLineItems.article.tenantArticleId',
			kind: 'string',
			path: ['orderLineItems', 'contains', 'article', 'tenantArticleId'],
		},
		{
			name: 'Line Item: Article Title',
			value: 'orderLineItems.article.title',
			kind: 'string',
			path: ['orderLineItems', 'contains', 'article', 'title'],
		},
		{
			name: 'Order Date',
			value: 'orderDate',
			kind: 'date',
			path: ['orderDate'],
			description:
				'A narrow order date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{
			name: 'Payment: Currency',
			value: 'paymentInfo.currency',
			kind: 'string',
			path: ['paymentInfo', 'currency'],
		},
		{
			name: 'Payment: Method',
			value: 'paymentInfo.method',
			kind: 'string',
			path: ['paymentInfo', 'method'],
		},
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: [
				{ name: 'Cancelled', value: 'CANCELLED' },
				{ name: 'Locked', value: 'LOCKED' },
				{ name: 'Obsolete', value: 'OBSOLETE' },
				{ name: 'Open', value: 'OPEN' },
				{ name: 'Promised', value: 'PROMISED' },
			],
		},
		{ name: 'Tag Value', value: 'tags.value', kind: 'string', path: ['tags', 'contains', 'value'] },
		{ name: 'Tenant Order ID', value: 'tenantOrderId', kind: 'string', path: ['tenantOrderId'] },
	],
	sortFields: [
		{ name: 'Order Date', value: 'orderDate', path: ['orderDate'] },
		{ name: 'Status', value: 'status', path: ['status'] },
	],
};

/** `InboundProcessSearchQuery` / `InboundProcessSort`. */
export const inboundSearchConfig: SearchResourceConfig = {
	resource: 'inbound',
	endpoint: '/api/inboundprocesses/search',
	propertyName: 'inboundProcesses',
	fields: [
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'string', path: ['facilityRef'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{
			name: 'Inbound Date',
			value: 'inboundDate',
			kind: 'dateEq',
			path: ['inboundDate', 'contains'],
		},
		{
			name: 'Purchase Order: Article ID',
			value: 'purchaseOrder.requestedItems.tenantArticleId',
			kind: 'string',
			path: ['purchaseOrder', 'requestedItems', 'contains', 'tenantArticleId'],
		},
		{
			name: 'Purchase Order: ID',
			value: 'purchaseOrder.id',
			kind: 'string',
			path: ['purchaseOrder', 'id'],
		},
		{
			name: 'Purchase Order: Order Date',
			value: 'purchaseOrder.orderDate',
			kind: 'date',
			path: ['purchaseOrder', 'orderDate'],
			description:
				'A narrow order date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{
			name: 'Purchase Order: Requested Date',
			value: 'purchaseOrder.requestedDate.value',
			kind: 'date',
			path: ['purchaseOrder', 'requestedDate', 'value'],
		},
		{
			name: 'Purchase Order: Requested Date Type',
			value: 'purchaseOrder.requestedDate.type',
			kind: 'enum',
			path: ['purchaseOrder', 'requestedDate', 'type'],
			enumOptions: [
				{ name: 'ASAP', value: 'ASAP' },
				{ name: 'Time Point', value: 'TIME_POINT' },
			],
		},
		{
			name: 'Purchase Order: Status',
			value: 'purchaseOrder.status',
			kind: 'enum',
			path: ['purchaseOrder', 'status'],
			enumOptions: [
				{ name: 'Canceled', value: 'CANCELED' },
				{ name: 'Open', value: 'OPEN' },
			],
		},
		{
			name: 'Purchase Order: Supplier Name',
			value: 'purchaseOrder.supplier.name',
			kind: 'string',
			path: ['purchaseOrder', 'supplier', 'name'],
		},
		{
			name: 'Purchase Order: Transfer ID',
			value: 'purchaseOrder.transfer.id',
			kind: 'string',
			path: ['purchaseOrder', 'transfer', 'id'],
		},
		{
			name: 'Receipt: ID',
			value: 'receipts.id',
			kind: 'string',
			path: ['receipts', 'contains', 'id'],
		},
		{
			name: 'Receipt: Received Date',
			value: 'receipts.receivedDate',
			kind: 'date',
			path: ['receipts', 'contains', 'receivedDate'],
		},
		{
			name: 'Receipt: Status',
			value: 'receipts.status',
			kind: 'enum',
			path: ['receipts', 'contains', 'status'],
			enumOptions: [
				{ name: 'Finished', value: 'FINISHED' },
				{ name: 'In Progress', value: 'IN_PROGRESS' },
				{ name: 'Open', value: 'OPEN' },
			],
		},
		{
			name: 'Scannable Code',
			value: 'scannableCodes',
			kind: 'stringEq',
			path: ['scannableCodes', 'contains'],
		},
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: [
				{ name: 'Closed', value: 'CLOSED' },
				{ name: 'On Hold', value: 'ON_HOLD' },
				{ name: 'Open', value: 'OPEN' },
				{ name: 'Partial Delivery', value: 'PARTIAL_DELIVERY' },
			],
		},
		{
			name: 'Tenant Inbound Process ID',
			value: 'tenantInboundProcessId',
			kind: 'string',
			path: ['tenantInboundProcessId'],
		},
	],
	sortFields: [
		{ name: 'Custom Attribute', value: 'customAttributes' },
		{ name: 'Last Modified', value: 'lastModified', path: ['lastModified'] },
		{ name: 'Purchase Order: Created', value: 'po_created', path: ['po_created'] },
		{
			name: 'Purchase Order: Requested Date',
			value: 'purchaseOrder.requestedDate.value',
			path: ['purchaseOrder', 'requestedDate', 'value'],
		},
		{
			name: 'Purchase Order: Requested Date Type',
			value: 'purchaseOrder.requestedDate.type',
			path: ['purchaseOrder', 'requestedDate', 'type'],
		},
		{
			name: 'Purchase Order: Supplier Name',
			value: 'purchaseOrder.supplier.name',
			path: ['purchaseOrder', 'supplier', 'name'],
		},
	],
};

/**
 * `ProcessSearchQuery` / `ProcessSort`.
 *
 * Processes have no `customAttributes`, so that section is dropped. The nested
 * `referenced.*` filters reach into other entities, which the API only allows at
 * the top level of a query — they are therefore always combined with AND.
 */
export const processSearchConfig: SearchResourceConfig = {
	resource: 'process',
	endpoint: '/api/processes/search',
	propertyName: 'processes',
	supportsCustomAttributes: false,
	fields: [
		{ name: 'Created', value: 'created', kind: 'date', path: ['created'] },
		{
			name: 'Document Ref',
			value: 'documentRefs',
			kind: 'stringEq',
			path: ['documentRefs', 'contains'],
		},
		{
			name: 'DOMS Status',
			value: 'domsStatus',
			kind: 'enum',
			path: ['domsStatus'],
			enumOptions: PROCESS_STATUS_OPTIONS,
		},
		{
			name: 'External Action Ref',
			value: 'externalActionRefs',
			kind: 'stringEq',
			path: ['externalActionRefs', 'contains'],
		},
		{
			name: 'Facility Ref',
			value: 'facilityRefs',
			kind: 'stringEq',
			path: ['facilityRefs', 'contains'],
		},
		{
			name: 'Facility Ref With Active Operations',
			value: 'facilityRefsWithActiveOperations',
			kind: 'string',
			path: ['facilityRefsWithActiveOperations'],
		},
		{
			name: 'Flat Ref',
			value: 'flatRefs',
			kind: 'stringEq',
			path: ['flatRefs', 'contains'],
			description: 'Matches the ID of any entity connected to the process',
		},
		{
			name: 'Handover Job Ref',
			value: 'handoverJobRefs',
			kind: 'stringEq',
			path: ['handoverJobRefs', 'contains'],
		},
		{
			name: 'Inventory Status',
			value: 'inventoryStatus',
			kind: 'enum',
			path: ['inventoryStatus'],
			enumOptions: PROCESS_STATUS_OPTIONS,
		},
		{
			name: 'Item Return Job Ref',
			value: 'itemReturnJobsRef',
			kind: 'stringEq',
			path: ['itemReturnJobsRef', 'contains'],
		},
		{
			name: 'Operative Status',
			value: 'operativeStatus',
			kind: 'enum',
			path: ['operativeStatus'],
			enumOptions: PROCESS_STATUS_OPTIONS,
		},
		{ name: 'Order Ref', value: 'orderRef', kind: 'string', path: ['orderRef'] },
		{
			name: 'Pack Job Ref',
			value: 'packJobRefs',
			kind: 'stringEq',
			path: ['packJobRefs', 'contains'],
		},
		{
			name: 'Pick Job Ref',
			value: 'pickJobRefs',
			kind: 'stringEq',
			path: ['pickJobRefs', 'contains'],
		},
		{ name: 'Process ID', value: 'processId', kind: 'search', path: ['processId'] },
		{
			name: 'Referenced: Article ID',
			value: 'referenced.tenantArticleId',
			kind: 'search',
			path: ['referenced', 'tenantArticleId'],
			topLevelOnly: true,
			description:
				'Cross-entity filters are always combined with AND, regardless of the Match setting',
		},
		{
			name: 'Referenced: Service Type',
			value: 'referenced.serviceType',
			kind: 'search',
			path: ['referenced', 'serviceType'],
			topLevelOnly: true,
			description:
				'Cross-entity filters are always combined with AND, regardless of the Match setting',
		},
		{
			name: 'Referenced: Target Time',
			value: 'referenced.targetTime',
			kind: 'date',
			path: ['referenced', 'targetTime'],
			topLevelOnly: true,
			description:
				'Cross-entity filters are always combined with AND, regardless of the Match setting',
		},
		{
			name: 'Return Ref',
			value: 'returnRefs',
			kind: 'stringEq',
			path: ['returnRefs', 'contains'],
		},
		{
			name: 'Return Status',
			value: 'returnStatus',
			kind: 'enum',
			path: ['returnStatus'],
			enumOptions: PROCESS_STATUS_OPTIONS,
		},
		{
			name: 'Routing Plan Ref',
			value: 'routingPlanRefs',
			kind: 'stringEq',
			path: ['routingPlanRefs', 'contains'],
		},
		{
			name: 'Search Term',
			value: 'searchTerm',
			kind: 'like',
			path: ['searchTerm'],
			description: 'Full-text search across the process',
		},
		{
			name: 'Service Job Ref',
			value: 'serviceJobRefs',
			kind: 'stringEq',
			path: ['serviceJobRefs', 'contains'],
		},
		{
			name: 'Shipment Ref',
			value: 'shipmentRefs',
			kind: 'stringEq',
			path: ['shipmentRefs', 'contains'],
		},
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: PROCESS_STATUS_OPTIONS,
		},
		{ name: 'Tag ID', value: 'tags.id', kind: 'string', path: ['tags', 'contains', 'id'] },
		{ name: 'Tag Value', value: 'tags.value', kind: 'string', path: ['tags', 'contains', 'value'] },
	],
	sortFields: [
		{ name: 'Active Facility Country', value: 'activeFacilityCountry', path: ['activeFacilityCountry'] },
		{ name: 'Active Facility Name', value: 'activeFacilityName', path: ['activeFacilityName'] },
		{ name: 'DOMS Status', value: 'domsStatus', path: ['domsStatus'] },
		{ name: 'Inventory Status', value: 'inventoryStatus', path: ['inventoryStatus'] },
		{ name: 'Operative Status', value: 'operativeStatus', path: ['operativeStatus'] },
		{ name: 'Process ID', value: 'processId', path: ['processId'] },
		{
			name: 'Referenced: Parcel Tracking Status',
			value: 'referenced.parcelTrackingStatus',
			path: ['referenced', 'parcelTrackingStatus'],
		},
		{
			name: 'Referenced: Target Time',
			value: 'referenced.targetTime',
			path: ['referenced', 'targetTime'],
		},
		{ name: 'Return Status', value: 'returnStatus', path: ['returnStatus'] },
		{ name: 'Status', value: 'status', path: ['status'] },
	],
};

/** `ListingSearchQuery` / `ListingSort`. */
export const listingSearchConfig: SearchResourceConfig = {
	resource: 'listing',
	endpoint: '/api/listings/search',
	propertyName: 'listings',
	fields: [
		{
			name: 'Availability Timeframe Start',
			value: 'availabilityTimeframe.start',
			kind: 'date',
			path: ['availabilityTimeframe', 'start'],
		},
		{
			name: 'Category Ref',
			value: 'categoryRefs',
			kind: 'stringEq',
			path: ['categoryRefs', 'contains'],
		},
		{
			name: 'Created',
			value: 'created',
			kind: 'date',
			path: ['created'],
			description:
				'A narrow created date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'string', path: ['facilityRef'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{
			name: 'Measurement Unit Key',
			value: 'measurementUnitKey',
			kind: 'string',
			path: ['measurementUnitKey'],
		},
		{
			name: 'Out Of Stock Behaviour',
			value: 'outOfStockBehaviour',
			kind: 'enum',
			path: ['outOfStockBehaviour'],
			enumOptions: OUT_OF_STOCK_BEHAVIOUR_OPTIONS,
		},
		{ name: 'Price', value: 'price', kind: 'number', path: ['price'] },
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: LISTING_STATUS_OPTIONS,
		},
		{ name: 'Tag ID', value: 'tags.id', kind: 'string', path: ['tags', 'contains', 'id'] },
		{ name: 'Tag Value', value: 'tags.value', kind: 'string', path: ['tags', 'contains', 'value'] },
		{
			name: 'Tenant Article ID',
			value: 'tenantArticleId',
			kind: 'string',
			path: ['tenantArticleId'],
		},
		{ name: 'Weight', value: 'weight', kind: 'number', path: ['weight'] },
	],
	sortFields: [
		{ name: 'Custom Attribute', value: 'customAttributes' },
		{ name: 'Last Modified', value: 'lastModified', path: ['lastModified'] },
		{ name: 'Tenant Article ID', value: 'tenantArticleId', path: ['tenantArticleId'] },
	],
};

/**
 * `PickJobSearchQuery` / `PickJobSort`.
 *
 * The query schema has no `customAttributes`, so that section is dropped.
 */
export const pickjobSearchConfig: SearchResourceConfig = {
	resource: 'pickjob',
	endpoint: '/api/pickjobs/search',
	propertyName: 'pickJobs',
	supportsCustomAttributes: false,
	fields: [
		{ name: 'Consumer Name', value: 'consumerName', kind: 'search', path: ['consumerName'] },
		{
			name: 'Created',
			value: 'created',
			kind: 'date',
			path: ['created'],
			description:
				'A narrow created date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'stringEq', path: ['facilityRef'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{ name: 'Last Modified', value: 'lastModified', kind: 'date', path: ['lastModified'] },
		{ name: 'Order Ref', value: 'orderRef', kind: 'stringEq', path: ['orderRef'] },
		{
			name: 'Preferred Picking Method',
			value: 'preferredPickingMethods',
			kind: 'enum',
			path: ['preferredPickingMethods', 'contains'],
			enumOptions: [
				{ name: 'Batch', value: 'BATCH' },
				{ name: 'Multi Order', value: 'MULTI_ORDER' },
				{ name: 'Single Order', value: 'SINGLE_ORDER' },
			],
		},
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: PICKJOB_STATUS_OPTIONS,
		},
		{ name: 'Target Time', value: 'targetTime', kind: 'date', path: ['targetTime'] },
		{
			name: 'Tenant Article ID',
			value: 'tenantArticleIds',
			kind: 'stringEq',
			path: ['tenantArticleIds', 'contains'],
		},
		{ name: 'Tenant Order ID', value: 'tenantOrderId', kind: 'string', path: ['tenantOrderId'] },
		{
			name: 'Transfer ID',
			value: 'transfers.id',
			kind: 'stringEq',
			path: ['transfers', 'contains', 'id'],
		},
	],
	sortFields: [
		{ name: 'Created', value: 'created', path: ['created'] },
		{ name: 'Last Modified', value: 'lastModified', path: ['lastModified'] },
		{ name: 'Target Time', value: 'targetTime', path: ['targetTime'] },
		{ name: 'Tenant Order ID', value: 'tenantOrderId', path: ['tenantOrderId'] },
	],
};

/**
 * `PackJobSearchQuery` / `PackJobSort`. The query schema has no
 * `customAttributes`, so that section is dropped.
 */
export const packjobSearchConfig: SearchResourceConfig = {
	resource: 'packjob',
	endpoint: '/api/packjobs/search',
	propertyName: 'packJobs',
	supportsCustomAttributes: false,
	fields: [
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'stringEq', path: ['facilityRef'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{
			name: 'Invoice: Company Name',
			value: 'invoice.companyName',
			kind: 'search',
			path: ['invoice', 'companyName'],
		},
		{ name: 'Invoice: Email', value: 'invoice.email', kind: 'search', path: ['invoice', 'email'] },
		{
			name: 'Invoice: First Name',
			value: 'invoice.firstName',
			kind: 'search',
			path: ['invoice', 'firstName'],
		},
		{
			name: 'Invoice: Last Name',
			value: 'invoice.lastName',
			kind: 'search',
			path: ['invoice', 'lastName'],
		},
		{ name: 'Last Modified', value: 'lastModified', kind: 'date', path: ['lastModified'] },
		{
			name: 'Line Item: Article ID',
			value: 'lineItems.article.tenantArticleId',
			kind: 'search',
			path: ['lineItems', 'contains', 'article', 'tenantArticleId'],
		},
		{
			name: 'Line Item: Article Title',
			value: 'lineItems.article.title',
			kind: 'search',
			path: ['lineItems', 'contains', 'article', 'title'],
		},
		{
			name: 'Order Date',
			value: 'orderDate',
			kind: 'date',
			path: ['orderDate'],
			description:
				'A narrow order date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{
			name: 'Packing Source Container Code',
			value: 'packingSourceContainers.codes',
			kind: 'stringEq',
			path: ['packingSourceContainers', 'contains', 'codes', 'contains'],
		},
		{
			name: 'Recipient: Company Name',
			value: 'recipient.companyName',
			kind: 'search',
			path: ['recipient', 'companyName'],
		},
		{
			name: 'Recipient: Email',
			value: 'recipient.email',
			kind: 'search',
			path: ['recipient', 'email'],
		},
		{
			name: 'Recipient: First Name',
			value: 'recipient.firstName',
			kind: 'search',
			path: ['recipient', 'firstName'],
		},
		{
			name: 'Recipient: Last Name',
			value: 'recipient.lastName',
			kind: 'search',
			path: ['recipient', 'lastName'],
		},
		{ name: 'Short ID', value: 'shortId', kind: 'search', path: ['shortId'] },
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: PACKJOB_STATUS_OPTIONS,
		},
		{ name: 'Target Time', value: 'targetTime', kind: 'date', path: ['targetTime'] },
		{ name: 'Tenant Order ID', value: 'tenantOrderId', kind: 'search', path: ['tenantOrderId'] },
	],
	sortFields: [
		{ name: 'Last Modified', value: 'lastModified', path: ['lastModified'] },
		{ name: 'Order Date', value: 'orderDate', path: ['orderDate'] },
		{ name: 'Target Time', value: 'targetTime', path: ['targetTime'] },
	],
};

/**
 * `HandoverJobSearchQuery` / `HandoverJobSort`. The query schema has no
 * `customAttributes`, so that section is dropped.
 */
export const handoverSearchConfig: SearchResourceConfig = {
	resource: 'handover',
	endpoint: '/api/handoverjobs/search',
	propertyName: 'handoverJobs',
	supportsCustomAttributes: false,
	fields: [
		{ name: 'Anonymized', value: 'anonymized', kind: 'boolean', path: ['anonymized'] },
		{
			name: 'Assigned User ID',
			value: 'assignedUsers.userId',
			kind: 'string',
			path: ['assignedUsers', 'contains', 'userId'],
		},
		{
			name: 'Assigned Username',
			value: 'assignedUsers.username',
			kind: 'search',
			path: ['assignedUsers', 'contains', 'username'],
		},
		{
			name: 'Channel',
			value: 'channel',
			kind: 'enum',
			path: ['channel'],
			enumOptions: HANDOVER_CHANNEL_OPTIONS,
		},
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'string', path: ['facilityRef'] },
		{ name: 'Full Identifier', value: 'fullIdentifier', kind: 'search', path: ['fullIdentifier'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{
			name: 'Invoice Address: Company Name',
			value: 'invoiceAddress.companyName',
			kind: 'search',
			path: ['invoiceAddress', 'companyName'],
		},
		{
			name: 'Invoice Address: Email',
			value: 'invoiceAddress.email',
			kind: 'search',
			path: ['invoiceAddress', 'email'],
		},
		{
			name: 'Invoice Address: First Name',
			value: 'invoiceAddress.firstName',
			kind: 'search',
			path: ['invoiceAddress', 'firstName'],
		},
		{
			name: 'Invoice Address: Last Name',
			value: 'invoiceAddress.lastName',
			kind: 'search',
			path: ['invoiceAddress', 'lastName'],
		},
		{
			name: 'Line Item: Article ID',
			value: 'handoverJobLineItems.article.tenantArticleId',
			kind: 'search',
			path: ['handoverJobLineItems', 'contains', 'article', 'tenantArticleId'],
		},
		{
			name: 'Line Item: Article Title',
			value: 'handoverJobLineItems.article.title',
			kind: 'search',
			path: ['handoverJobLineItems', 'contains', 'article', 'title'],
		},
		{
			name: 'Parcel: Carrier Key',
			value: 'handoverJobParcelInfo.carrierKey',
			kind: 'string',
			path: ['handoverJobParcelInfo', 'carrierKey'],
		},
		{
			name: 'Parcel: Carrier Ref',
			value: 'handoverJobParcelInfo.carrierRef',
			kind: 'string',
			path: ['handoverJobParcelInfo', 'carrierRef'],
		},
		{
			name: 'Parcel: Carrier Tracking Number',
			value: 'handoverJobParcelInfo.carrierTrackingNumber',
			kind: 'string',
			path: ['handoverJobParcelInfo', 'carrierTrackingNumber'],
		},
		{
			name: 'Parcel: Shipment Ref',
			value: 'handoverJobParcelInfo.shipmentRef',
			kind: 'string',
			path: ['handoverJobParcelInfo', 'shipmentRef'],
		},
		{ name: 'Pick Job Ref', value: 'pickJobRef', kind: 'stringEq', path: ['pickJobRef'] },
		{
			name: 'Recipient Address: Company Name',
			value: 'recipientAddress.companyName',
			kind: 'search',
			path: ['recipientAddress', 'companyName'],
		},
		{
			name: 'Recipient Address: Email',
			value: 'recipientAddress.email',
			kind: 'search',
			path: ['recipientAddress', 'email'],
		},
		{
			name: 'Recipient Address: First Name',
			value: 'recipientAddress.firstName',
			kind: 'search',
			path: ['recipientAddress', 'firstName'],
		},
		{
			name: 'Recipient Address: Last Name',
			value: 'recipientAddress.lastName',
			kind: 'search',
			path: ['recipientAddress', 'lastName'],
		},
		{ name: 'Short Identifier', value: 'shortIdentifier', kind: 'search', path: ['shortIdentifier'] },
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: HANDOVER_STATUS_OPTIONS,
		},
		{ name: 'Target Time', value: 'targetTime', kind: 'date', path: ['targetTime'] },
		{ name: 'Tenant Order ID', value: 'tenantOrderId', kind: 'search', path: ['tenantOrderId'] },
	],
	sortFields: [{ name: 'Target Time', value: 'targetTime', path: ['targetTime'] }],
};

/** `ParcelSearchQuery` / `ParcelSort`. Belongs to the Shipment resource. */
export const parcelSearchConfig: SearchResourceConfig = {
	resource: 'shipment',
	operation: 'searchParcels',
	endpoint: '/api/parcels/search',
	propertyName: 'parcels',
	supportsCustomAttributes: false,
	fields: [
		{ name: 'Carrier Ref', value: 'carrierRef', kind: 'string', path: ['carrierRef'] },
		{
			name: 'Carrier Tracking Number',
			value: 'result.carrierTrackingNumber',
			kind: 'string',
			path: ['result', 'carrierTrackingNumber'],
		},
		{
			name: 'Created',
			value: 'created',
			kind: 'date',
			path: ['created'],
			description:
				'A narrow created date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'string', path: ['facilityRef'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{
			name: 'Invoice: Company Name',
			value: 'invoice.companyName',
			kind: 'search',
			path: ['invoice', 'companyName'],
		},
		{ name: 'Invoice: Email', value: 'invoice.email', kind: 'search', path: ['invoice', 'email'] },
		{
			name: 'Invoice: First Name',
			value: 'invoice.firstName',
			kind: 'search',
			path: ['invoice', 'firstName'],
		},
		{
			name: 'Invoice: Last Name',
			value: 'invoice.lastName',
			kind: 'search',
			path: ['invoice', 'lastName'],
		},
		{
			name: 'Item: Article ID',
			value: 'items.article.tenantArticleId',
			kind: 'search',
			path: ['items', 'contains', 'article', 'tenantArticleId'],
		},
		{
			name: 'Item: Article Title',
			value: 'items.article.title',
			kind: 'search',
			path: ['items', 'contains', 'article', 'title'],
		},
		{ name: 'Last Modified', value: 'lastModified', kind: 'date', path: ['lastModified'] },
		{
			name: 'Recipient: Company Name',
			value: 'recipient.companyName',
			kind: 'search',
			path: ['recipient', 'companyName'],
		},
		{
			name: 'Recipient: Email',
			value: 'recipient.email',
			kind: 'search',
			path: ['recipient', 'email'],
		},
		{
			name: 'Recipient: First Name',
			value: 'recipient.firstName',
			kind: 'search',
			path: ['recipient', 'firstName'],
		},
		{
			name: 'Recipient: Last Name',
			value: 'recipient.lastName',
			kind: 'search',
			path: ['recipient', 'lastName'],
		},
		{ name: 'Shipment Ref', value: 'shipmentRef', kind: 'string', path: ['shipmentRef'] },
		{ name: 'Short ID', value: 'shortId', kind: 'string', path: ['shortId'] },
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: PARCEL_STATUS_OPTIONS,
		},
		{ name: 'Tenant Order ID', value: 'tenantOrderId', kind: 'string', path: ['tenantOrderId'] },
	],
	sortFields: [
		{ name: 'Created', value: 'created', path: ['created'] },
		{ name: 'Last Modified', value: 'lastModified', path: ['lastModified'] },
	],
};

/** `ShipmentSearchQuery` / `ShipmentSort`. Belongs to the Shipment resource. */
export const shipmentSearchConfig: SearchResourceConfig = {
	resource: 'shipment',
	operation: 'searchShipments',
	endpoint: '/api/shipments/search',
	propertyName: 'shipments',
	supportsCustomAttributes: false,
	fields: [
		{ name: 'Anonymized', value: 'anonymized', kind: 'boolean', path: ['anonymized'] },
		{ name: 'Carrier Key', value: 'carrierKey', kind: 'string', path: ['carrierKey'] },
		{ name: 'Carrier Ref', value: 'carrierRef', kind: 'string', path: ['carrierRef'] },
		{
			name: 'Created',
			value: 'created',
			kind: 'date',
			path: ['created'],
			description:
				'A narrow created date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'string', path: ['facilityRef'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{
			name: 'Parcel Status',
			value: 'parcels.status',
			kind: 'enum',
			path: ['parcels', 'contains', 'status'],
			enumOptions: PARCEL_STATUS_OPTIONS,
		},
		{ name: 'Pick Job Ref', value: 'pickJobRef', kind: 'string', path: ['pickJobRef'] },
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: SHIPMENT_STATUS_OPTIONS,
		},
		{ name: 'Target Time', value: 'targetTime', kind: 'date', path: ['targetTime'] },
		{ name: 'Tenant Order ID', value: 'tenantOrderId', kind: 'string', path: ['tenantOrderId'] },
	],
	sortFields: [
		{ name: 'Created', value: 'created', path: ['created'] },
		{ name: 'Target Time', value: 'targetTime', path: ['targetTime'] },
	],
};

/** `LinkedServiceJobsSearchQuery` / `LinkedServiceJobsSort`. Belongs to the Service resource. */
export const linkedServiceJobsSearchConfig: SearchResourceConfig = {
	resource: 'service',
	operation: 'searchLinked',
	endpoint: '/api/linkedservicejobs/search',
	propertyName: 'linkedServiceJobs',
	supportsCustomAttributes: false,
	fields: [
		{
			name: 'Additional Information',
			value: 'additionalInformation',
			kind: 'stringEq',
			path: ['additionalInformation', 'contains'],
		},
		{
			name: 'Article Title',
			value: 'articleTitles',
			kind: 'stringEq',
			path: ['articleTitles', 'contains'],
		},
		{
			name: 'Channel',
			value: 'channel',
			kind: 'enum',
			path: ['channel'],
			enumOptions: SERVICE_CHANNEL_OPTIONS,
		},
		{ name: 'Consumer Name', value: 'consumerName', kind: 'search', path: ['consumerName'] },
		{ name: 'Facility Ref', value: 'facilityRef', kind: 'string', path: ['facilityRef'] },
		{ name: 'ID', value: 'id', kind: 'string', path: ['id'] },
		{ name: 'Invoice Address', value: 'invoiceAddress', kind: 'search', path: ['invoiceAddress'] },
		{ name: 'Last Modified', value: 'lastModified', kind: 'date', path: ['lastModified'] },
		{
			name: 'Linked Service Job Ref',
			value: 'linkedServiceJobRef',
			kind: 'string',
			path: ['linkedServiceJobRef'],
		},
		{ name: 'Service Name', value: 'serviceName', kind: 'stringEq', path: ['serviceName', 'contains'] },
		{ name: 'Shipping Address', value: 'shippingAddress', kind: 'search', path: ['shippingAddress'] },
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: LINKED_SERVICE_JOB_STATUS_OPTIONS,
		},
		{ name: 'Target Time', value: 'targetTime', kind: 'date', path: ['targetTime'] },
		{ name: 'Tenant Order ID', value: 'tenantOrderId', kind: 'search', path: ['tenantOrderId'] },
	],
	sortFields: [
		{ name: 'Last Modified', value: 'lastModified', path: ['lastModified'] },
		{ name: 'Target Time', value: 'targetTime', path: ['targetTime'] },
	],
};

/** `RoutingPlanSearchQuery` / `RoutingPlanSort`. */
export const routingPlanSearchConfig: SearchResourceConfig = {
	resource: 'routingplan',
	endpoint: '/api/routingplans/search',
	propertyName: 'routingPlans',
	supportsCustomAttributes: false,
	fields: [
		{ name: 'Anonymized', value: 'anonymized', kind: 'boolean', path: ['anonymized'] },
		{
			name: 'Delivery: Collect Facility Ref',
			value: 'deliveryPreferences.collect.facilityRef',
			kind: 'string',
			path: ['deliveryPreferences', 'collect', 'contains', 'facilityRef'],
		},
		{
			name: 'Delivery: Collect Paid',
			value: 'deliveryPreferences.collect.paid',
			kind: 'boolean',
			path: ['deliveryPreferences', 'collect', 'contains', 'paid'],
		},
		{
			name: 'Delivery: Preferred Carrier',
			value: 'deliveryPreferences.shipping.preferredCarriers',
			kind: 'stringEq',
			path: ['deliveryPreferences', 'shipping', 'preferredCarriers', 'contains'],
		},
		{
			name: 'Delivery: Supplying Facility',
			value: 'deliveryPreferences.supplyingFacilities',
			kind: 'stringEq',
			path: ['deliveryPreferences', 'supplyingFacilities', 'contains'],
		},
		{
			name: 'Delivery: Target Time',
			value: 'deliveryPreferences.targetTime',
			kind: 'date',
			path: ['deliveryPreferences', 'targetTime'],
		},
		{
			name: 'Earliest Picking Start Carrier Ref',
			value: 'earliestPickingStart.carrierRef',
			kind: 'string',
			path: ['earliestPickingStart', 'carrierRef'],
		},
		{
			name: 'Earliest Picking Start Date',
			value: 'earliestPickingStart.earliestPickingStartDate',
			kind: 'date',
			path: ['earliestPickingStart', 'earliestPickingStartDate'],
		},
		{
			name: 'History: Created',
			value: 'history.created',
			kind: 'date',
			path: ['history', 'contains', 'created'],
		},
		{
			name: 'Latest Picking Start Carrier Ref',
			value: 'latestPickingStart.carrierRef',
			kind: 'string',
			path: ['latestPickingStart', 'carrierRef'],
		},
		{
			name: 'Latest Picking Start Date',
			value: 'latestPickingStart.latestPickingStartDate',
			kind: 'date',
			path: ['latestPickingStart', 'latestPickingStartDate'],
		},
		{
			name: 'Order Date',
			value: 'orderDate',
			kind: 'date',
			path: ['orderDate'],
			description:
				'A narrow order date range is strongly recommended — it greatly improves response times on large datasets',
		},
		{
			name: 'Order Line Item ID',
			value: 'orderLineItems.id',
			kind: 'string',
			path: ['orderLineItems', 'contains', 'id'],
		},
		{ name: 'Order Ref', value: 'orderRef', kind: 'string', path: ['orderRef'] },
		{ name: 'Pick Job Ref', value: 'pickJobRef', kind: 'string', path: ['pickJobRef'] },
		{ name: 'Priority', value: 'priority', kind: 'number', path: ['priority'] },
		{ name: 'Process ID', value: 'processId', kind: 'string', path: ['processId'] },
		{ name: 'Provisioning Time', value: 'provisioningTime', kind: 'date', path: ['provisioningTime'] },
		{ name: 'Reroute Reason', value: 'reRouteReason', kind: 'string', path: ['reRouteReason'] },
		{ name: 'Split Count', value: 'splitCount', kind: 'number', path: ['splitCount'] },
		{
			name: 'Status',
			value: 'status',
			kind: 'enum',
			path: ['status'],
			enumOptions: ROUTING_PLAN_STATUS_OPTIONS,
		},
		{
			name: 'Target Address: City',
			value: 'targetAddress.city',
			kind: 'string',
			path: ['targetAddress', 'city'],
		},
		{
			name: 'Target Address: Country',
			value: 'targetAddress.country',
			kind: 'string',
			path: ['targetAddress', 'country'],
		},
		{
			name: 'Target Address: Province',
			value: 'targetAddress.province',
			kind: 'string',
			path: ['targetAddress', 'province'],
		},
		{
			name: 'Target Address: Street',
			value: 'targetAddress.street',
			kind: 'string',
			path: ['targetAddress', 'street'],
		},
	],
	sortFields: [
		{ name: 'Anonymized', value: 'anonymized', path: ['anonymized'] },
		{ name: 'Order Date', value: 'orderDate', path: ['orderDate'] },
		{ name: 'Order Ref', value: 'orderRef', path: ['orderRef'] },
		{ name: 'Process ID', value: 'processId', path: ['processId'] },
		{ name: 'Provisioning Time', value: 'provisioningTime', path: ['provisioningTime'] },
		{ name: 'Status', value: 'status', path: ['status'] },
	],
};

/** Search configs by resource, used by the node's `execute` router. */
export const searchConfigs: Record<string, SearchResourceConfig> = {
	facility: facilitySearchConfig,
	order: orderSearchConfig,
	inbound: inboundSearchConfig,
	process: processSearchConfig,
	listing: listingSearchConfig,
	pickjob: pickjobSearchConfig,
	packjob: packjobSearchConfig,
	handover: handoverSearchConfig,
	routingplan: routingPlanSearchConfig,
};

/** Search configs keyed by operation for resources whose search isn't named `search`. */
export const searchConfigsByOperation: Record<string, SearchResourceConfig> = {
	searchParcels: parcelSearchConfig,
	searchShipments: shipmentSearchConfig,
	searchLinked: linkedServiceJobsSearchConfig,
};
