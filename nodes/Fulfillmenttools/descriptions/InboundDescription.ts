import type { INodeProperties } from 'n8n-workflow';

const RESOURCE = ['inbound'];

const showForInboundCreate = {
	show: {
		resource: RESOURCE,
		operation: ['create'],
	},
};

// Receipt fields are shared by Create (inline receipt) and Add Receipt.
const showForInboundReceipt = {
	show: {
		resource: RESOURCE,
		operation: ['create', 'addReceipt'],
	},
};

/**
 * Operations available for the Inbound (inbound process) resource.
 */
export const inboundOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: RESOURCE } },
		options: [
			{
				name: 'Add Receipt',
				value: 'addReceipt',
				description: 'Add a receipt to an inbound process',
				action: 'Add a receipt to an inbound process',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new inbound process',
				action: 'Create an inbound process',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an inbound process',
				action: 'Delete an inbound process',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single inbound process',
				action: 'Get an inbound process',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many inbound processes',
				action: 'Get many inbound processes',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing inbound process',
				action: 'Update an inbound process',
			},
		],
		default: 'create',
	},
];

/**
 * Fields for the Inbound resource.
 */
export const inboundFields: INodeProperties[] = [
	// ----------------------------------
	//   get / update / delete — identifier
	// ----------------------------------
	{
		displayName: 'Inbound Process',
		name: 'inboundProcessId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get', 'update', 'delete', 'addReceipt'],
			},
		},
		description: 'The inbound process to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchInboundProcesses',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
				hint: 'The fulfillmenttools inbound process ID',
			},
		],
	},

	// ----------------------------------
	//   getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getAll'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Facility Ref',
				name: 'facilityRef',
				type: 'string',
				default: '',
				description: 'Filter by the facility the inbound process takes place in',
			},
			{
				displayName: 'Scannable Code',
				name: 'scannableCode',
				type: 'string',
				default: '',
				description: 'Filter by a scannable code (e.g. a delivery note barcode)',
			},
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				default: '',
				description:
					'Partial match across tenant inbound process ID, scannable codes, article IDs, supplier name and related listings',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'LAST_MODIFIED_DESC',
				options: [
					{ name: 'Last Modified (Ascending)', value: 'LAST_MODIFIED_ASC' },
					{ name: 'Last Modified (Descending)', value: 'LAST_MODIFIED_DESC' },
					{ name: 'Origin Name (Ascending)', value: 'ORIGIN_NAME_ASC' },
					{ name: 'Origin Name (Descending)', value: 'ORIGIN_NAME_DESC' },
					{ name: 'Requested Date (Ascending)', value: 'REQUESTED_DATE_ASC' },
					{ name: 'Requested Date (Descending)', value: 'REQUESTED_DATE_DESC' },
				],
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Closed', value: 'CLOSED' },
					{ name: 'On Hold', value: 'ON_HOLD' },
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Partial Delivery', value: 'PARTIAL_DELIVERY' },
				],
			},
		],
	},

	// ----------------------------------
	//   get / getAll — simplify
	// ----------------------------------
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get', 'getAll'],
			},
		},
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},

	// ----------------------------------
	//   update — version
	// ----------------------------------
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		required: true,
		default: 1,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['update'],
			},
		},
		description:
			'Current version of the inbound process, required for optimistic locking. Retrieve it first with the Get operation.',
	},

	// ----------------------------------
	//   create
	// ----------------------------------
	{
		displayName: 'Facility',
		name: 'facilityRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: showForInboundCreate,
		description: 'The facility in which the inbound process takes place',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchFacilities',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
				hint: 'Facility ID, or a tenantFacilityId in URN format (urn:fft:facility:tenantFacilityId:<value>)',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForInboundCreate,
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the inbound process',
			},
			{
				displayName: 'On Hold',
				name: 'onHold',
				type: 'boolean',
				default: false,
				description: 'Whether the inbound process is on hold and will not be processed further',
			},
			{
				displayName: 'Scannable Codes',
				name: 'scannableCodes',
				type: 'string',
				default: '',
				placeholder: 'e.g. 1234567890, 0987654321',
				description: 'Comma-separated scannable codes relevant to the inbound process',
			},
			{
				displayName: 'Tenant Inbound Process ID',
				name: 'tenantInboundProcessId',
				type: 'string',
				default: '',
				placeholder: 'e.g. INB-2026-001',
				description: "The inbound process's ID in your own system",
			},
		],
	},

	// ----------------------------------
	//   create — purchase order
	// ----------------------------------
	{
		displayName: 'Purchase Order',
		name: 'purchaseOrder',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForInboundCreate,
		description:
			'Purchase order for this inbound process. Requires an order date, requested date and at least one line item if set.',
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the purchase order',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'dateTime',
				default: '',
				description: 'Date and time at which the order was placed',
			},
			{
				displayName: 'Requested Date',
				name: 'requestedDate',
				type: 'dateTime',
				default: '',
				description:
					'Date and time the order is expected to arrive (used when Requested Date Type is Time Point)',
			},
			{
				displayName: 'Requested Date Type',
				name: 'requestedDateType',
				type: 'options',
				default: 'TIME_POINT',
				options: [
					{ name: 'ASAP', value: 'ASAP' },
					{ name: 'Time Point', value: 'TIME_POINT' },
				],
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: [
					{ name: 'Canceled', value: 'CANCELED' },
					{ name: 'Open', value: 'OPEN' },
				],
			},
			{
				displayName: 'Supplier Name',
				name: 'supplierName',
				type: 'string',
				default: '',
				placeholder: 'e.g. Speedy Boxales Ltd.',
				description: 'Name of the supplier',
			},
		],
	},
	{
		displayName: 'Purchase Order Line Items',
		name: 'purchaseOrderLineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		displayOptions: showForInboundCreate,
		description: 'Line items expected to be delivered',
		options: [
			{
				name: 'item',
				displayName: 'Line Item',
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{
						displayName: 'Tenant Article ID',
						name: 'tenantArticleId',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. 4711',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						required: true,
						default: 1,
						typeOptions: { minValue: 0 },
					},
					{
						displayName: 'Quantity Unit',
						name: 'quantityUnit',
						type: 'string',
						default: '',
						placeholder: 'e.g. piece',
						description: 'Unit of measurement; must match the listing measurementUnitKey if set',
					},
					{
						displayName: 'Custom Attributes (JSON)',
						name: 'customAttributes',
						type: 'json',
						default: '{}',
						description: 'Free-form attributes stored on the line item',
					},
					{
						displayName: 'Stock Properties (JSON)',
						name: 'stockProperties',
						type: 'json',
						default: '{}',
						description:
							'Stock properties to set on the created stock, e.g. { "expiry": "2027-01-01", "batch": "B-42" }',
					},
				],
			},
		],
	},

	// ----------------------------------
	//   create / addReceipt — receipt
	// ----------------------------------
	{
		displayName: 'Receipt',
		name: 'receipt',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForInboundReceipt,
		description:
			'A goods receipt. Requires a received date and at least one received item if set.',
		options: [
			{
				displayName: 'ASN Ref',
				name: 'asnRef',
				type: 'string',
				default: '',
				description: 'Maps this receipt to an ASN in the inbound process',
			},
			{
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				description: 'A comment on the receipt',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the receipt',
			},
			{
				displayName: 'Received Date',
				name: 'receivedDate',
				type: 'dateTime',
				default: '',
				description: 'Date and time the items arrived at the facility',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'FINISHED',
				options: [
					{
						name: 'Finished',
						value: 'FINISHED',
						description: 'Receipt is booked and stock is created',
					},
					{
						name: 'In Progress',
						value: 'IN_PROGRESS',
						description: 'Partial receipt, not yet booked',
					},
					{ name: 'Open', value: 'OPEN' },
				],
			},
		],
	},
	{
		displayName: 'Received Items',
		name: 'receivedItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Received Item',
		default: {},
		displayOptions: showForInboundReceipt,
		description: 'Items that arrived at the facility',
		options: [
			{
				name: 'item',
				displayName: 'Received Item',
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{
						displayName: 'Tenant Article ID',
						name: 'tenantArticleId',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. 4711',
					},
					{
						displayName: 'Accepted Quantity',
						name: 'acceptedQuantity',
						type: 'number',
						required: true,
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Quantity accepted; stock is created when the receipt is Finished',
					},
					{
						displayName: 'Accepted Quantity Unit',
						name: 'acceptedQuantityUnit',
						type: 'string',
						default: '',
						placeholder: 'e.g. piece',
					},
					{
						displayName: 'Rejected Quantity',
						name: 'rejectedQuantity',
						type: 'number',
						required: true,
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Quantity rejected; defective stock is created when the receipt is Finished',
					},
					{
						displayName: 'Rejected Quantity Unit',
						name: 'rejectedQuantityUnit',
						type: 'string',
						default: '',
						placeholder: 'e.g. piece',
					},
					{
						displayName: 'Storage Location Ref',
						name: 'storageLocationRef',
						type: 'string',
						default: '',
						description: 'Storage location on which the stock was placed',
					},
					{
						displayName: 'Comment',
						name: 'comment',
						type: 'string',
						default: '',
						description: 'A comment on the received item',
					},
					{
						displayName: 'Stock Properties (JSON)',
						name: 'stockProperties',
						type: 'json',
						default: '{}',
						description:
							'Stock properties to set on the created stock, e.g. { "expiry": "2027-01-01", "batch": "B-42" }',
					},
				],
			},
		],
	},

	// ----------------------------------
	//   update — fields
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the inbound process',
			},
			{
				displayName: 'On Hold',
				name: 'onHold',
				type: 'boolean',
				default: false,
				description: 'Whether the inbound process is on hold and will not be processed further',
			},
			{
				displayName: 'Scannable Codes',
				name: 'scannableCodes',
				type: 'string',
				default: '',
				placeholder: 'e.g. 1234567890, 0987654321',
				description: 'Comma-separated scannable codes relevant to the inbound process',
			},
		],
	},

	// ----------------------------------
	//   create / update — escape hatch
	// ----------------------------------
	{
		displayName: 'Additional Body Fields (JSON)',
		name: 'additionalBodyFields',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update', 'addReceipt'],
			},
		},
		description:
			'Advanced: raw JSON merged into the request body for fields not listed above (on Create e.g. additional receipts; on Add Receipt e.g. stock properties). See the InboundProcess schemas in the API reference.',
	},
];
