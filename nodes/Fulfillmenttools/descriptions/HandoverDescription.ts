import type { INodeProperties } from 'n8n-workflow';

import { HANDOVER_CHANNEL_OPTIONS, HANDOVER_STATUS_OPTIONS } from '../SearchConfigs';

const RESOURCE = ['handover'];

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
					{ displayName: 'Locale', name: 'locale', type: 'string', default: '', placeholder: 'e.g. en_US' },
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
				{ displayName: 'Key', name: 'key', type: 'string', required: true, default: '', placeholder: 'e.g. color' },
				{ displayName: 'Value', name: 'value', type: 'string', required: true, default: '', placeholder: 'e.g. red' },
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
	description: 'Customizable information about the line item recorded during the process',
	options: [
		{
			name: 'attribute',
			displayName: 'Recordable Attribute',
			// Ordered for UX (localized key first) rather than alphabetically.
			// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
			values: [
				{ displayName: 'Key Locale', name: 'keyLocale', type: 'string', required: true, default: '', placeholder: 'e.g. en_US' },
				{ displayName: 'Localized Key', name: 'localizedKey', type: 'string', required: true, default: '', placeholder: 'e.g. Country of origin' },
				{ displayName: 'Group', name: 'group', type: 'string', default: '', placeholder: 'e.g. general' },
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
				{ displayName: 'Value', name: 'value', type: 'string', default: '', placeholder: 'e.g. Germany' },
			],
		},
	],
};

/** The article + common line-item value fields, with optional required/trailing extras. */
function lineItemValues(afterQuantity: INodeProperties[] = [], atEnd: INodeProperties[] = []): INodeProperties[] {
	return [
		{
			displayName: 'Tenant Article ID',
			name: 'tenantArticleId',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'e.g. 4711',
			description: 'Reference to the article',
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
			description: 'Quantity of the article',
		},
		...afterQuantity,
		{
			displayName: 'Secondary Quantity',
			name: 'secondaryQuantity',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Secondary quantity, e.g. weight when quantity is a count. 0 to omit.',
		},
		{ displayName: 'Measurement Unit Key', name: 'measurementUnitKey', type: 'string', default: '', placeholder: 'e.g. pcs' },
		{ displayName: 'Secondary Measurement Unit Key', name: 'secondaryMeasurementUnitKey', type: 'string', default: '', placeholder: 'e.g. g' },
		{ displayName: 'Global Line Item ID', name: 'globalLineItemId', type: 'string', default: '', description: 'Links this line item to line items of other operational entities' },
		{ displayName: 'Scannable Codes', name: 'scannableCodes', type: 'string', default: '', placeholder: 'e.g. 4711, 4712', description: 'Comma-separated codes for scanning this line item' },
		{ displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '', placeholder: 'e.g. https://example.com/image.png', description: 'A publicly reachable link to a picture of the article' },
		{ displayName: 'Weight', name: 'weight', type: 'number', default: 0, typeOptions: { minValue: 0 }, description: 'Article weight in grams. 0 to omit.' },
		localizedField('titleLocalized', 'Title Localized', 'Translations of the article title, keyed by locale'),
		ARTICLE_ATTRIBUTES_FIELD,
		tagsField(),
		RECORDABLE_ATTRIBUTES_FIELD,
		{ displayName: 'Article Custom Attributes (JSON)', name: 'articleCustomAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the article' },
		{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the line item' },
		{ displayName: 'Stickers (JSON)', name: 'stickers', type: 'json', default: '[]', description: 'Array of stickers for this line item. See Sticker in the API reference.' },
		...atEnd,
		{ displayName: 'Additional Fields (JSON)', name: 'additionalFields', type: 'json', default: '{}', description: 'Advanced: raw JSON merged into the line item for anything else' },
	];
}

/** A ConsumerAddress collection (invoice / recipient). */
function addressField(name: string, displayName: string): INodeProperties {
	return {
		displayName,
		name,
		type: 'collection',
		placeholder: 'Add Address Field',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		options: [
			{ displayName: 'Additional Address Info', name: 'additionalAddressInfo', type: 'string', default: '', placeholder: 'e.g. c/o Mrs. Müller' },
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
			{ displayName: 'City', name: 'city', type: 'string', default: '', placeholder: 'e.g. Langenfeld' },
			{ displayName: 'Company Name', name: 'companyName', type: 'string', default: '', placeholder: 'e.g. Speedy Boxales Ltd.' },
			{ displayName: 'Country', name: 'country', type: 'string', default: '', placeholder: 'e.g. DE', description: 'Two-letter country code as per ISO 3166-1 alpha-2' },
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the address' },
			{ displayName: 'Email', name: 'email', type: 'string', default: '', placeholder: 'e.g. name@example.com' },
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', placeholder: 'e.g. Maxine' },
			{ displayName: 'House Number', name: 'houseNumber', type: 'string', default: '', placeholder: 'e.g. 42a' },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', placeholder: 'e.g. Muller' },
			{ displayName: 'Latitude', name: 'latitude', type: 'number', default: 0, typeOptions: { numberPrecision: 6 }, description: 'Coordinate latitude. Both latitude and longitude must be set together.' },
			{ displayName: 'Longitude', name: 'longitude', type: 'number', default: 0, typeOptions: { numberPrecision: 6 }, description: 'Coordinate longitude. Both latitude and longitude must be set together.' },
			{ displayName: 'Personal Title', name: 'personalTitle', type: 'string', default: '', placeholder: 'e.g. Dr.' },
			{ displayName: 'Phone Numbers (JSON)', name: 'phoneNumbers', type: 'json', default: '[]', description: 'Array of phone numbers, e.g. [{"value":"+49...","type":"MOBILE"}]' },
			{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '', placeholder: 'e.g. 40764' },
			{ displayName: 'Province', name: 'province', type: 'string', default: '', placeholder: 'e.g. NRW' },
			{ displayName: 'Salutation', name: 'salutation', type: 'string', default: '', placeholder: 'e.g. Frau' },
			{ displayName: 'Street', name: 'street', type: 'string', default: '', placeholder: 'e.g. Hauptstr.' },
		],
	};
}

/** A repeatable line-item collection with the shared fields plus per-variant extras. */
function lineItemsCollection(
	name: string,
	displayName: string,
	description: string,
	afterQuantity: INodeProperties[] = [],
	atEnd: INodeProperties[] = [],
): INodeProperties {
	return {
		displayName,
		name,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description,
		options: [
			{
				name: 'item',
				displayName: 'Line Item',
				values: lineItemValues(afterQuantity, atEnd),
			},
		],
	};
}

/** Operations available for the Handover Job resource. */
export const handoverOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: RESOURCE } },
		options: [
			{ name: 'Create', value: 'create', description: 'Create a handover job', action: 'Create a handover job' },
			{ name: 'Get', value: 'get', description: 'Retrieve a single handover job', action: 'Get a handover job' },
			{ name: 'Get Many', value: 'getAll', description: 'Retrieve many handover jobs', action: 'Get many handover jobs' },
			{ name: 'Search', value: 'search', description: 'Find handover jobs matching a set of conditions', action: 'Search handover jobs' },
			{ name: 'Update', value: 'update', description: 'Update a handover job', action: 'Update a handover job' },
		],
		default: 'search',
	},
];

/** Fields for the Handover Job resource. */
export const handoverFields: INodeProperties[] = [
	// ----------------------------------
	//   handover job identifier (get / update)
	// ----------------------------------
	{
		displayName: 'Handover Job ID',
		name: 'handoverjobId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: { show: { resource: RESOURCE, operation: ['get', 'update'] } },
		description: 'The handover job to operate on',
	},

	// ----------------------------------
	//   getAll — pagination + filters
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: RESOURCE, operation: ['getAll', 'search'] } },
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: RESOURCE, operation: ['getAll', 'search'], returnAll: [false] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['getAll'] } },
		options: [
			{ displayName: 'Anonymized', name: 'anonymized', type: 'boolean', default: false },
			{ displayName: 'Assigned User', name: 'assignedUser', type: 'string', default: '', description: 'User ID or username assigned to the handover job' },
			{
				displayName: 'Carrier Refs',
				name: 'carrierRefs',
				type: 'string',
				default: '',
				placeholder: 'e.g. c1, c2',
				description: 'Comma-separated carrier references',
			},
			{
				displayName: 'Channel',
				name: 'channel',
				type: 'options',
				default: 'DELIVERY',
				options: HANDOVER_CHANNEL_OPTIONS,
			},
			{ displayName: 'End Target Time', name: 'endTargetTime', type: 'dateTime', default: '' },
			{ displayName: 'Facility Ref', name: 'facilityRef', type: 'string', default: '' },
			{ displayName: 'Pick Job Ref', name: 'pickJobRef', type: 'string', default: '' },
			{ displayName: 'Search Term', name: 'searchTerm', type: 'string', default: '' },
			{ displayName: 'Shipment Ref', name: 'shipmentRef', type: 'string', default: '' },
			{ displayName: 'Start Target Time', name: 'startTargetTime', type: 'dateTime', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: HANDOVER_STATUS_OPTIONS,
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
		displayOptions: { show: { resource: RESOURCE, operation: ['get', 'getAll', 'search'] } },
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
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'The facility where the handover takes place',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchFacilities', searchable: true },
			},
			{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63' },
		],
	},
	{
		displayName: 'Channel',
		name: 'channel',
		type: 'options',
		required: true,
		default: 'DELIVERY',
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		options: HANDOVER_CHANNEL_OPTIONS,
		description: 'Whether the handover is a delivery or a collect',
	},
	{
		displayName: 'Order Date',
		name: 'orderDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'The date the order was created in the supplying system',
	},
	{
		displayName: 'Target Time',
		name: 'targetTime',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'The time the handover job is expected to be picked up at the facility',
	},

	// ----------------------------------
	//   create — line item collections
	// ----------------------------------
	lineItemsCollection(
		'handoverJobLineItems',
		'Handover Job Line Items',
		'The articles being handed over',
		[
			{
				displayName: 'Handed Over Quantity',
				name: 'handedOverQuantity',
				type: 'number',
				required: true,
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Quantity of the item that has been handed over',
			},
		],
		[
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: [
					{ name: 'Closed', value: 'CLOSED' },
					{ name: 'Open', value: 'OPEN' },
				],
			},
			{ displayName: 'Refused (JSON)', name: 'refused', type: 'json', default: '[]', description: 'Array of refused items. See RefusedItem in the API reference.' },
			{ displayName: 'Substitute Line Items (JSON)', name: 'substituteLineItems', type: 'json', default: '[]', description: 'Beta: array of substitute line items. See HandoverSubstituteLineItemForCreation.' },
		],
	),
	lineItemsCollection(
		'expectedHandoverJobLineItems',
		'Expected Handover Job Line Items',
		'The articles expected to be handed over',
		[],
		[{ displayName: 'Transfer ID', name: 'transferId', type: 'string', default: '' }],
	),
	lineItemsCollection(
		'missingHandoverJobLineItems',
		'Missing Handover Job Line Items',
		'The articles that are missing from the handover',
	),

	// ----------------------------------
	//   create — structured collections
	// ----------------------------------
	{
		...tagsField(),
		name: 'handoverTags',
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'Tags for the handover job. Only allowed when no process is related to it.',
	},
	{
		displayName: 'Assigned Users',
		name: 'assignedUsers',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Assigned User',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'Users assigned to this handover job',
		options: [
			{
				name: 'user',
				displayName: 'User',
				values: [
					{ displayName: 'User ID', name: 'userId', type: 'string', default: '', description: 'ID of the user to assign. Takes precedence over Username.' },
					{ displayName: 'Username', name: 'username', type: 'string', default: '', description: 'Username of the user to assign, used if no User ID is set' },
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
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		options: [
			{
				name: 'transfer',
				displayName: 'Transfer',
				values: [
					{ displayName: 'ID', name: 'id', type: 'string', required: true, default: '', description: 'ID of the transfer' },
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
	addressField('invoiceAddress', 'Invoice Address'),
	addressField('recipientAddress', 'Recipient Address'),
	{
		displayName: 'Parcel Info',
		name: 'handoverJobParcelInfo',
		type: 'collection',
		placeholder: 'Add Parcel Field',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'Carrier and parcel references for the handover',
		options: [
			{ displayName: 'Carrier Logo URL', name: 'carrierLogoUrl', type: 'string', default: '', placeholder: 'e.g. https://example.com/logo.png' },
			{ displayName: 'Carrier Parcel Ref', name: 'carrierParcelRef', type: 'string', default: '', description: 'The reference number of the parcel by the carrier' },
			{ displayName: 'Carrier Ref', name: 'carrierRef', type: 'string', default: '', description: 'Reference to the related carrier' },
			{ displayName: 'Carrier Tracking Number', name: 'carrierTrackingNumber', type: 'string', default: '' },
			{ displayName: 'Parcel Ref', name: 'parcelRef', type: 'string', default: '', description: 'Reference to the related parcel' },
			{ displayName: 'Shipment Ref', name: 'shipmentRef', type: 'string', default: '', description: 'Reference to the related shipment' },
		],
	},
	{
		displayName: 'Workflow Information',
		name: 'workflowInformation',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'Whether this handover job is part of a workflow',
		options: [
			{ displayName: 'Is Available', name: 'isAvailable', type: 'boolean', default: false, description: 'Whether this handover job is part of a workflow' },
			{ displayName: 'Instance Ref', name: 'instanceRef', type: 'string', default: '', description: 'ID of the workflow instance (only when Is Available is on)' },
			{ displayName: 'Node Ref', name: 'nodeRef', type: 'string', default: '', description: 'ID of the workflow node (only when Is Available is on)' },
		],
	},

	// ----------------------------------
	//   create — additional scalar fields
	// ----------------------------------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		options: [
			{
				displayName: 'Cancel Reason',
				name: 'cancelReason',
				type: 'options',
				default: 'ORDER_CANCELED',
				options: [
					{ name: 'Consumer No Show', value: 'CONSUMER_NO_SHOW' },
					{ name: 'Consumer Rejects', value: 'CONSUMER_REJECTS' },
					{ name: 'Order Canceled', value: 'ORDER_CANCELED' },
				],
			},
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the handover job' },
			{ displayName: 'Full Identifier', name: 'fullIdentifier', type: 'string', default: '', description: 'Information to identify the recipient' },
			{ displayName: 'Operative Process Ref', name: 'operativeProcessRef', type: 'string', default: '', description: 'Reference to the operative process this handover job belongs to' },
			{ displayName: 'Paid', name: 'paid', type: 'boolean', default: false, description: 'Whether the order is already paid' },
			{ displayName: 'Pick Job Ref', name: 'pickJobRef', type: 'string', default: '', description: 'Reference to the pick job this handover job is assigned to' },
			{ displayName: 'Process ID', name: 'processId', type: 'string', default: '', description: 'ID of the global process related to this handover job' },
			{ displayName: 'Routing Plan Ref', name: 'routingPlanRef', type: 'string', default: '', description: 'Reference to the routing plan this handover job is assigned to' },
			{ displayName: 'Short Identifier', name: 'shortIdentifier', type: 'string', default: '', description: 'The short identifier of the shipment' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: HANDOVER_STATUS_OPTIONS,
			},
			{ displayName: 'Tenant Order ID', name: 'tenantOrderId', type: 'string', default: '', placeholder: 'e.g. R456728546' },
		],
	},
	{
		displayName: 'Stickers (JSON)',
		name: 'stickers',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description: 'Array of stickers for the handover job. See Sticker in the API reference.',
	},
	{
		displayName: 'Additional Body Fields (JSON)',
		name: 'additionalBodyFields',
		type: 'json',
		default: '{}',
		displayOptions: { show: { resource: RESOURCE, operation: ['create'] } },
		description:
			'Advanced: raw JSON merged into the handover job for any field not listed above. See HandoverjobForCreation in the API reference.',
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
		displayOptions: { show: { resource: RESOURCE, operation: ['update'] } },
		description:
			'Current version of the handover job, required for optimistic locking. Retrieve it first with the Get operation.',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource: RESOURCE, operation: ['update'] } },
		description: 'Changes applied to the handover job as a ModifyHandoverjob action',
		options: [
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the handover job' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'HANDED_OVER',
				options: HANDOVER_STATUS_OPTIONS,
			},
		],
	},
	{
		displayName: 'Additional Actions (JSON)',
		name: 'additionalActions',
		type: 'json',
		default: '[]',
		displayOptions: { show: { resource: RESOURCE, operation: ['update'] } },
		description:
			'Advanced: extra patch actions appended after the one above. See HandoverjobPatchActions in the API reference.',
	},
];
