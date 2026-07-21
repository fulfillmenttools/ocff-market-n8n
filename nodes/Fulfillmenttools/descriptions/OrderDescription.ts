import type { INodeProperties } from 'n8n-workflow';

const showForOrder = {
	show: {
		resource: ['order'],
	},
};

const showForOrderCreate = {
	show: {
		resource: ['order'],
		operation: ['create'],
	},
};

const showForOrderUpdate = {
	show: {
		resource: ['order'],
		operation: ['update'],
	},
};

const showForOrderCreateOrUpdate = {
	show: {
		resource: ['order'],
		operation: ['create', 'update'],
	},
};

/**
 * Operations available for the Order resource.
 */
export const orderOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showForOrder,
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new order',
				action: 'Create an order',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single order',
				action: 'Get an order',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many orders',
				action: 'Get many orders',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing order',
				action: 'Update an order',
			},
		],
		default: 'create',
	},
];

/**
 * Fields for the Order resource.
 */
export const orderFields: INodeProperties[] = [
	// ----------------------------------
	//   order: get / update — identifier
	// ----------------------------------
	{
		displayName: 'Order',
		name: 'orderId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['get', 'update'],
			},
		},
		description: 'The order to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchOrders',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
				hint: 'The fulfillmenttools order ID',
			},
		],
	},

	// ----------------------------------
	//   order: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['order'],
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
				resource: ['order'],
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
				resource: ['order'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Consumer ID',
				name: 'consumerId',
				type: 'string',
				default: '',
				description: 'Filter orders by consumer ID',
			},
			{
				displayName: 'Tenant Order ID',
				name: 'tenantOrderId',
				type: 'string',
				default: '',
				description: "Filter orders by the order's ID in your own system",
			},
		],
	},

	// ----------------------------------
	//   order: get / getAll — simplify
	// ----------------------------------
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['get', 'getAll'],
			},
		},
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},

	// ----------------------------------
	//   order: update — version
	// ----------------------------------
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		required: true,
		default: 1,
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['update'],
			},
		},
		description:
			'Current version of the order, required for optimistic locking. Retrieve it first with the Get operation.',
	},

	// ----------------------------------
	//   order: create
	// ----------------------------------
	{
		displayName: 'Order Date',
		name: 'orderDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: showForOrderCreate,
		description: 'The date this order was created in the supplying system',
	},
	{
		displayName: 'Order Line Items',
		name: 'orderLineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		required: true,
		displayOptions: showForOrderCreate,
		description: 'The articles ordered',
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
						description: 'Reference to the article number in your own system',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. Cologne Water',
						description: 'The title of the product',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						required: true,
						default: 1,
						typeOptions: { minValue: 1 },
						description: 'Quantity of the article that has been ordered',
					},
					{
						displayName: 'Image URL',
						name: 'imageUrl',
						type: 'string',
						default: '',
						placeholder: 'e.g. https://example.com/image.png',
						description: 'A publicly accessible link to a picture of the article',
					},
					{
						displayName: 'Custom Attributes (JSON)',
						name: 'customAttributes',
						type: 'json',
						default: '{}',
						description: 'Free-form attributes stored on this line item',
					},
					{
						displayName: 'Scannable Codes',
						name: 'scannableCodes',
						type: 'string',
						default: '',
						placeholder: 'e.g. 4006381333931, 5901234123457',
						description: 'Comma-separated list of codes that identify the article',
					},
				],
			},
		],
	},
	{
		displayName: 'Consumer',
		name: 'consumer',
		type: 'collection',
		placeholder: 'Add Consumer Field',
		default: {},
		displayOptions: showForOrderCreateOrUpdate,
		description: 'The consumer this order is for',
		options: [
			{
				displayName: 'Addresses (JSON)',
				name: 'addresses',
				type: 'json',
				default: '[]',
				description:
					'Array of consumer addresses (billing/shipping). See ConsumerAddress in the API reference.',
			},
			{
				displayName: 'Consumer ID',
				name: 'consumerId',
				type: 'string',
				default: '',
				placeholder: 'e.g. e4213a07-f563-46a3-b1ba-4dfeb6abe82a',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the consumer',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'e.g. nathan@example.com',
				default: '',
			},
			{
				displayName: 'Facility Ref',
				name: 'facilityRef',
				type: 'string',
				default: '',
				placeholder: 'e.g. e4213a07-f563-46a3-b1ba-4dfeb6abe82a',
				description: 'ID of the facility, if the recipient is a facility',
			},
			{
				displayName: 'Tenant Facility ID',
				name: 'tenantFacilityId',
				type: 'string',
				default: '',
				description: 'The facility ID in your own system, if the recipient is a facility',
			},
		],
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Tag',
		default: {},
		displayOptions: showForOrderCreate,
		description: 'Tags to attach to the order',
		options: [
			{
				name: 'tag',
				displayName: 'Tag',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. priority',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. high',
					},
				],
			},
		],
	},
	{
		displayName: 'Status Reasons',
		name: 'statusReasons',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Status Reason',
		default: {},
		displayOptions: showForOrderCreate,
		description: 'Reasons explaining why the order has its status',
		options: [
			{
				name: 'reason',
				displayName: 'Status Reason',
				values: [
					{
						displayName: 'Reason',
						name: 'reason',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. Out of stock',
						description: 'The reason for setting this order status',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						required: true,
						default: 'OPEN',
						options: [
							{ name: 'Cancelled', value: 'CANCELLED' },
							{ name: 'Locked', value: 'LOCKED' },
							{ name: 'Obsolete', value: 'OBSOLETE' },
							{ name: 'Open', value: 'OPEN' },
							{ name: 'Promised', value: 'PROMISED' },
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Payment Info',
		name: 'paymentInfo',
		type: 'collection',
		placeholder: 'Add Payment Field',
		default: {},
		displayOptions: showForOrderCreate,
		description: 'Payment details for the order',
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: '',
				placeholder: 'e.g. EUR',
				description: 'The currency the consumer paid with',
			},
			{
				displayName: 'Method Localized (JSON)',
				name: 'methodLocalized',
				type: 'json',
				default: '{}',
				description: 'A locale-to-string map of the payment method, e.g. { "en_US": "Credit Card" }',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForOrderCreate,
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the order',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: [
					{ name: 'Cancelled', value: 'CANCELLED' },
					{ name: 'Locked', value: 'LOCKED' },
					{ name: 'Obsolete', value: 'OBSOLETE' },
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Promised', value: 'PROMISED' },
				],
			},
			{
				displayName: 'Tenant Order ID',
				name: 'tenantOrderId',
				type: 'string',
				default: '',
				placeholder: 'e.g. R456728546',
				description: "A reference to this order's ID in your own system",
			},
			{
				displayName: 'Valid Until',
				name: 'validUntil',
				type: 'dateTime',
				default: '',
				description:
					'For promised orders: the date and time at which the order expires and is automatically cancelled if not converted. Must be between 1 minute and 8 hours from now.',
			},
		],
	},

	// ----------------------------------
	//   order: update — fields
	// ----------------------------------
	{
		displayName: 'Order Line Items',
		name: 'updateOrderLineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		displayOptions: showForOrderUpdate,
		description:
			'Replaces the order line items of the order. All order lines must be included here, only the included lines will remain after the update.',
		options: [
			{
				name: 'item',
				displayName: 'Line Item',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						default: '',
						placeholder: 'e.g. LGMl2DuvPnfPoSHhYFOm',
						description: 'The ID of an existing order line item',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
						typeOptions: { minValue: 0 },
						description: 'The quantity of this order line item',
					},
					{
						displayName: 'Tenant Article ID',
						name: 'tenantArticleId',
						type: 'string',
						default: '',
						placeholder: 'e.g. 4711',
						description: 'Reference to the article number in your own system',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						placeholder: 'e.g. Cologne Water',
						description: 'The title of the product',
					},
				],
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				description: 'A comment for updating this order',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the order',
			},
			{
				displayName: 'Preferred Handling Time',
				name: 'preferredHandlingTime',
				type: 'dateTime',
				default: '',
				description:
					'Preferred handling time for ship-from-store orders, or provisioning time for click-and-collect orders',
			},
		],
	},

	// ----------------------------------
	//   order: create / update — escape hatch
	// ----------------------------------
	{
		displayName: 'Additional Body Fields (JSON)',
		name: 'additionalBodyFields',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create', 'update'],
			},
		},
		description:
			'Advanced: raw JSON merged into the request body for fields not listed above (e.g. deliveryPreferences, customServices, source, stickers, pricing). See OrderForCreation / OrderForUpdate in the API reference.',
	},
];
