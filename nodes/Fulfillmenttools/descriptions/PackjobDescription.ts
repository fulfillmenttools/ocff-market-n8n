import type { INodeProperties } from 'n8n-workflow';

import { PACKJOB_STATUS_OPTIONS } from '../SearchConfigs';

const RESOURCE = ['packjob'];

/** Operations that address a single pack job by ID. */
const SINGLE_PACKJOB_OPERATIONS = [
	'get',
	'update',
	'getDeliveryNote',
	'getReturnNote',
	'getTransferLabel',
];

/** Operations that download a PDF. */
const DOWNLOAD_OPERATIONS = ['getDeliveryNote', 'getReturnNote', 'getTransferLabel'];

/** A locale/value translation collection (`LocaleString`). */
function localizedField(name: string, displayName: string, description: string): INodeProperties {
	return {
		displayName,
		name,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Translation',
		default: {},
		description,
		options: [
			{
				name: 'translation',
				displayName: 'Translation',
				values: [
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: '',
						placeholder: 'e.g. en_US',
					},
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	};
}

/** A Tags collection (`TagReference[]`). */
function tagsField(): INodeProperties {
	return {
		displayName: 'Tags',
		name: 'tags',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Tag',
		default: {},
		options: [
			{
				name: 'tag',
				displayName: 'Tag',
				values: [
					{ displayName: 'ID', name: 'id', type: 'string', required: true, default: '' },
					{ displayName: 'Value', name: 'value', type: 'string', required: true, default: '' },
				],
			},
		],
	};
}

/** An article Attributes collection (`ArticleAttributeItem[]`). */
const ARTICLE_ATTRIBUTES_FIELD: INodeProperties = {
	displayName: 'Article Attributes',
	name: 'attributes',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Attribute',
	default: {},
	description: 'Article attributes. Key and value are required; the rest are optional.',
	options: [
		{
			name: 'attribute',
			displayName: 'Attribute',
			values: [
				{
					displayName: 'Key',
					name: 'key',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. color',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. red',
				},
				{
					displayName: 'Type',
					name: 'type',
					type: 'options',
					default: 'STRING',
					options: [
						{ name: 'Boolean', value: 'BOOLEAN' },
						{ name: 'Currency', value: 'CURRENCY' },
						{ name: 'Number', value: 'NUMBER' },
						{ name: 'String', value: 'STRING' },
					],
				},
				{
					displayName: 'Priority',
					name: 'priority',
					type: 'number',
					default: 1001,
					typeOptions: { minValue: 1, maxValue: 1001 },
					description: 'Priority within the category. Lower is higher priority.',
				},
			],
		},
	],
};

/** A Recordable Attributes collection (`RecordableAttributeForCreation[]`). */
const RECORDABLE_ATTRIBUTES_FIELD: INodeProperties = {
	displayName: 'Recordable Attributes',
	name: 'recordableAttributes',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Recordable Attribute',
	default: {},
	description: 'Customizable information about the line item that can be recorded during the process',
	options: [
		{
			name: 'attribute',
			displayName: 'Recordable Attribute',
			// Ordered for UX (localized key first) rather than alphabetically.
			// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
			values: [
				{
					displayName: 'Key Locale',
					name: 'keyLocale',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. en_US',
				},
				{
					displayName: 'Localized Key',
					name: 'localizedKey',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. Country of origin',
				},
				{
					displayName: 'Group',
					name: 'group',
					type: 'string',
					default: '',
					placeholder: 'e.g. general',
				},
				{
					displayName: 'Recording Rule',
					name: 'recordingRule',
					type: 'options',
					default: 'OPTIONAL',
					options: [
						{ name: 'Mandatory', value: 'MANDATORY' },
						{ name: 'Optional', value: 'OPTIONAL' },
					],
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
					placeholder: 'e.g. Germany',
				},
			],
		},
	],
};

/** A ConsumerAddress collection (invoice / recipient). */
function addressField(name: string, displayName: string): INodeProperties {
	return {
		displayName,
		name,
		type: 'collection',
		placeholder: 'Add Address Field',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Additional Address Info',
				name: 'additionalAddressInfo',
				type: 'string',
				default: '',
				placeholder: 'e.g. c/o Mrs. Müller',
			},
			{
				displayName: 'Address Type',
				name: 'addressType',
				type: 'options',
				default: 'POSTAL_ADDRESS',
				options: [
					{ name: 'Invoice Address', value: 'INVOICE_ADDRESS' },
					{ name: 'Parcel Locker', value: 'PARCEL_LOCKER' },
					{ name: 'Postal Address', value: 'POSTAL_ADDRESS' },
				],
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				placeholder: 'e.g. Langenfeld',
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
				placeholder: 'e.g. Speedy Boxales Ltd.',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				placeholder: 'e.g. DE',
				description: 'Two-letter country code as per ISO 3166-1 alpha-2',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the address',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'e.g. name@example.com',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				placeholder: 'e.g. Maxine',
			},
			{
				displayName: 'House Number',
				name: 'houseNumber',
				type: 'string',
				default: '',
				placeholder: 'e.g. 42a',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				placeholder: 'e.g. Muller',
			},
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description: 'Coordinate latitude. Both latitude and longitude must be set together.',
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description: 'Coordinate longitude. Both latitude and longitude must be set together.',
			},
			{
				displayName: 'Personal Title',
				name: 'personalTitle',
				type: 'string',
				default: '',
				placeholder: 'e.g. Dr.',
			},
			{
				displayName: 'Phone Numbers (JSON)',
				name: 'phoneNumbers',
				type: 'json',
				default: '[]',
				description: 'Array of phone numbers, e.g. [{"value":"+49...","type":"MOBILE"}]',
			},
			{
				displayName: 'Postal Code',
				name: 'postalCode',
				type: 'string',
				default: '',
				placeholder: 'e.g. 40764',
			},
			{
				displayName: 'Province',
				name: 'province',
				type: 'string',
				default: '',
				placeholder: 'e.g. NRW',
			},
			{
				displayName: 'Salutation',
				name: 'salutation',
				type: 'string',
				default: '',
				placeholder: 'e.g. Frau',
			},
			{
				displayName: 'Street',
				name: 'street',
				type: 'string',
				default: '',
				placeholder: 'e.g. Hauptstr.',
			},
		],
	};
}

/** Operations available for the Pack Job resource (Packing (Operations) endpoints). */
export const packjobOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: RESOURCE,
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a pack job',
				action: 'Create a pack job',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single pack job',
				action: 'Get a pack job',
			},
			{
				name: 'Get Delivery Note',
				value: 'getDeliveryNote',
				description: 'Download the delivery note PDF of a pack job',
				action: 'Get a pack job delivery note',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many pack jobs',
				action: 'Get many pack jobs',
			},
			{
				name: 'Get Return Note',
				value: 'getReturnNote',
				description: 'Download the return note PDF of a pack job',
				action: 'Get a pack job return note',
			},
			{
				name: 'Get Transfer Label',
				value: 'getTransferLabel',
				description: 'Download the transfer label PDF of a pack job',
				action: 'Get a pack job transfer label',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Find pack jobs matching a set of conditions',
				action: 'Search pack jobs',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a pack job',
				action: 'Update a pack job',
			},
		],
		default: 'search',
	},
];

/** Fields for the Pack Job resource. */
export const packjobFields: INodeProperties[] = [
	// ----------------------------------
	//   pack job identifier
	// ----------------------------------
	{
		displayName: 'Pack Job ID',
		name: 'packJobId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: SINGLE_PACKJOB_OPERATIONS,
			},
		},
		description: 'The pack job to operate on',
	},
	{
		displayName: 'Put Output File in Field',
		name: 'outputBinaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: DOWNLOAD_OPERATIONS,
			},
		},
		hint: 'The name of the output binary field to put the downloaded PDF in',
	},

	// ----------------------------------
	//   getAll — pagination + filters
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getAll', 'search'],
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
				operation: ['getAll', 'search'],
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
			{ displayName: 'Anonymized', name: 'anonymized', type: 'boolean', default: false },
			{
				displayName: 'Article Title',
				name: 'articleTitle',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Assigned User',
				name: 'assignedUser',
				type: 'string',
				default: '',
				description: 'User ID or username assigned to the pack job',
			},
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				default: 'SHIPPING',
				options: [
					{ name: 'Collect', value: 'COLLECT' },
					{ name: 'Shipping', value: 'SHIPPING' },
				],
			},
			{ displayName: 'End Order Date', name: 'endOrderDate', type: 'dateTime', default: '' },
			{ displayName: 'End Target Time', name: 'endTargetTime', type: 'dateTime', default: '' },
			{ displayName: 'Facility Ref', name: 'facilityRef', type: 'string', default: '' },
			{
				displayName: 'Modified By Username',
				name: 'modifiedByUsername',
				type: 'string',
				default: '',
			},
			{ displayName: 'Order Ref', name: 'orderRef', type: 'string', default: '' },
			{ displayName: 'Pick Job Ref', name: 'pickJobRef', type: 'string', default: '' },
			{ displayName: 'Process ID', name: 'processId', type: 'string', default: '' },
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				default: '',
				placeholder: 'e.g. R456728546',
			},
			{ displayName: 'Short ID', name: 'shortId', type: 'string', default: '' },
			{
				displayName: 'Source Container Codes',
				name: 'sourceContainerCodes',
				type: 'string',
				default: '',
				placeholder: 'e.g. C1, C2',
				description: 'Comma-separated source container codes',
			},
			{ displayName: 'Start Order Date', name: 'startOrderDate', type: 'dateTime', default: '' },
			{ displayName: 'Start Target Time', name: 'startTargetTime', type: 'dateTime', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: PACKJOB_STATUS_OPTIONS,
			},
			{ displayName: 'Tenant Order ID', name: 'tenantOrderId', type: 'string', default: '' },
		],
	},

	// ----------------------------------
	//   get / getAll / search — simplify
	// ----------------------------------
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get', 'getAll', 'search'],
			},
		},
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},

	// ----------------------------------
	//   create — required
	// ----------------------------------
	{
		displayName: 'Facility',
		name: 'facilityRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'The facility that should fulfill the pack job',
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
			},
		],
	},
	{
		displayName: 'Line Items',
		name: 'lineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'The articles to pack',
		options: [
			{
				name: 'item',
				displayName: 'Line Item',
				// Ordered for UX (identifiers first) rather than alphabetically.
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{
						displayName: 'Tenant Article ID',
						name: 'tenantArticleId',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. 4711',
						description: 'Reference to the article to pack',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. Cologne Water',
						description: 'Title of the article',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						required: true,
						default: 1,
						typeOptions: { minValue: 1 },
						description: 'Quantity of the article to pack',
					},
					{
						displayName: 'Secondary Quantity',
						name: 'secondaryQuantity',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Secondary quantity, e.g. weight when quantity is a count. 0 to omit.',
					},
					{
						displayName: 'Measurement Unit Key',
						name: 'measurementUnitKey',
						type: 'string',
						default: '',
						placeholder: 'e.g. pcs',
					},
					{
						displayName: 'Secondary Measurement Unit Key',
						name: 'secondaryMeasurementUnitKey',
						type: 'string',
						default: '',
						placeholder: 'e.g. g',
					},
					{
						displayName: 'Global Line Item ID',
						name: 'globalLineItemId',
						type: 'string',
						default: '',
						description: 'Links this line item to line items of other operational entities',
					},
					{
						displayName: 'Scannable Codes',
						name: 'scannableCodes',
						type: 'string',
						default: '',
						placeholder: 'e.g. 4711, 4712',
						description: 'Comma-separated codes for scanning this line item',
					},
					{
						displayName: 'Service Job Refs',
						name: 'serviceJobRefs',
						type: 'string',
						default: '',
						placeholder: 'e.g. sj-1, sj-2',
						description: 'Comma-separated references to service jobs that altered this line item',
					},
					{
						displayName: 'Image URL',
						name: 'imageUrl',
						type: 'string',
						default: '',
						placeholder: 'e.g. https://example.com/image.png',
						description: 'A publicly reachable link to a picture of the article',
					},
					{
						displayName: 'Weight',
						name: 'weight',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Article weight in grams. 0 to omit.',
					},
					localizedField(
						'titleLocalized',
						'Title Localized',
						'Translations of the article title, keyed by locale',
					),
					ARTICLE_ATTRIBUTES_FIELD,
					tagsField(),
					RECORDABLE_ATTRIBUTES_FIELD,
					{
						displayName: 'Article Custom Attributes (JSON)',
						name: 'articleCustomAttributes',
						type: 'json',
						default: '{}',
						description: 'Free-form attributes stored on the article',
					},
					{
						displayName: 'Custom Attributes (JSON)',
						name: 'customAttributes',
						type: 'json',
						default: '{}',
						description: 'Free-form attributes stored on the line item',
					},
					{
						displayName: 'Stickers (JSON)',
						name: 'stickers',
						type: 'json',
						default: '[]',
						description: 'Array of stickers for this line item. See Sticker in the API reference.',
					},
					{
						displayName: 'Additional Fields (JSON)',
						name: 'additionalFields',
						type: 'json',
						default: '{}',
						description:
							'Advanced: raw JSON merged into the line item for anything else. See PackLineItemForCreation in the API reference.',
					},
				],
			},
		],
	},
	{
		displayName: 'Workflow Information',
		name: 'workflowInformation',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description:
			'Whether this pack job is part of a workflow. Required by the API; defaults to not part of a workflow.',
		options: [
			{
				displayName: 'Is Available',
				name: 'isAvailable',
				type: 'boolean',
				default: false,
				description: 'Whether this pack job is part of a workflow',
			},
			{
				displayName: 'Instance Ref',
				name: 'instanceRef',
				type: 'string',
				default: '',
				description: 'ID of the workflow instance (only when Is Available is on)',
			},
			{
				displayName: 'Node Ref',
				name: 'nodeRef',
				type: 'string',
				default: '',
				description: 'ID of the workflow node (only when Is Available is on)',
			},
		],
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the pack job',
			},
			{
				displayName: 'Delivery Channel',
				name: 'deliveryChannel',
				type: 'options',
				default: 'SHIPPING',
				options: [
					{ name: 'Collect', value: 'COLLECT' },
					{ name: 'Shipping', value: 'SHIPPING' },
				],
			},
			{
				displayName: 'Operative Process Ref',
				name: 'operativeProcessRef',
				type: 'string',
				default: '',
				description: 'Reference to the operative process this pack job belongs to',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'dateTime',
				default: '',
				description: 'Date when the order was placed',
			},
			{
				displayName: 'Order Ref',
				name: 'orderRef',
				type: 'string',
				default: '',
				description: 'ID of the order',
			},
			{
				displayName: 'Pick Job Ref',
				name: 'pickJobRef',
				type: 'string',
				default: '',
				description: 'Reference to the pick job',
			},
			{
				displayName: 'Process ID',
				name: 'processId',
				type: 'string',
				default: '',
				description: 'ID of the global process related to this pack job',
			},
			{
				displayName: 'Recipient Name',
				name: 'recipientName',
				type: 'string',
				default: '',
				description: 'The name of the recipient',
			},
			{
				displayName: 'Short ID',
				name: 'shortId',
				type: 'string',
				default: '',
				description: 'The short identifier of the shipment',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: PACKJOB_STATUS_OPTIONS,
			},
			{
				displayName: 'Target Time',
				name: 'targetTime',
				type: 'dateTime',
				default: '',
				description: 'Until when the pack job must be finished',
			},
			{
				displayName: 'Tenant Order ID',
				name: 'tenantOrderId',
				type: 'string',
				default: '',
				placeholder: 'e.g. R456728546',
			},
		],
	},
	{
		...tagsField(),
		name: 'packJobTags',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'Tags for the pack job. Only allowed when no process is related to it.',
	},
	{
		displayName: 'Assigned Users',
		name: 'assignedUsers',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Assigned User',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'Users assigned to this pack job',
		options: [
			{
				name: 'user',
				displayName: 'User',
				values: [
					{
						displayName: 'User ID',
						name: 'userId',
						type: 'string',
						default: '',
						description: 'ID of the user to assign. Takes precedence over Username.',
					},
					{
						displayName: 'Username',
						name: 'username',
						type: 'string',
						default: '',
						description: 'Username of the user to assign, used if no User ID is set',
					},
				],
			},
		],
	},
	{
		displayName: 'Transfers',
		name: 'transfers',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Transfer',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'transfer',
				displayName: 'Transfer',
				values: [
					{
						displayName: 'ID',
						name: 'id',
						type: 'string',
						required: true,
						default: '',
						description: 'ID of the transfer',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						required: true,
						default: 'RECEIVER',
						options: [
							{ name: 'Receiver', value: 'RECEIVER' },
							{ name: 'Supplier', value: 'SUPPLIER' },
						],
					},
				],
			},
		],
	},
	addressField('invoice', 'Invoice Address'),
	addressField('recipient', 'Recipient Address'),
	{
		displayName: 'Additional Body Fields (JSON)',
		name: 'additionalBodyFields',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description:
			'Advanced: raw JSON merged into the pack job for any field not listed above. See PackJobForCreation in the API reference.',
	},

	// ----------------------------------
	//   update
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
			'Current version of the pack job, required for optimistic locking. Retrieve it first with the Get operation.',
	},
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
		description: 'Changes applied to the pack job as a ModifyPackJob action',
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the pack job',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'IN_PROGRESS',
				options: PACKJOB_STATUS_OPTIONS,
			},
		],
	},
	{
		displayName: 'Line Item Modifications',
		name: 'lineItemModifications',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Modification',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['update'],
			},
		},
		description: 'Set the packed amount of pack line items (ModifyPackLineItem actions)',
		options: [
			{
				name: 'modification',
				displayName: 'Modification',
				values: [
					{
						displayName: 'Line Item ID',
						name: 'id',
						type: 'string',
						required: true,
						default: '',
						description: 'ID of the pack line item to modify',
					},
					{
						displayName: 'Packed',
						name: 'packed',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Amount packed for this line. Cannot exceed the picked amount.',
					},
				],
			},
		],
	},
	{
		displayName: 'Pause Pack Job',
		name: 'pausePackJob',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['update'],
			},
		},
		description: 'Whether to add a PausePackJob action',
	},
	{
		displayName: 'Pause Line Item Updates',
		name: 'pauseLineItemUpdates',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Update',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['update'],
				pausePackJob: [true],
			},
		},
		description: 'Packed amounts to record while pausing',
		options: [
			{
				name: 'update',
				displayName: 'Update',
				values: [
					{
						displayName: 'Line Item ID',
						name: 'id',
						type: 'string',
						required: true,
						default: '',
					},
					{
						displayName: 'Packed',
						name: 'packed',
						type: 'number',
						required: true,
						default: 0,
						typeOptions: { minValue: 0 },
					},
				],
			},
		],
	},
	{
		displayName: 'Additional Actions (JSON)',
		name: 'additionalActions',
		type: 'json',
		default: '[]',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['update'],
			},
		},
		description:
			'Advanced: extra patch actions appended after the ones above. See PackJobPatchActions in the API reference.',
	},
];
