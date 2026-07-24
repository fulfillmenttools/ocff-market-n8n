import type { INodeProperties } from 'n8n-workflow';

const RESOURCE = ['return'];

const JOB_ID_OPS = [
	'listReturns',
	'createReturn',
	'getReturn',
	'updateReturnedLineItems',
	'updateReturnedLineItem',
];
const RETURN_ID_OPS = ['getReturn', 'updateReturnedLineItems', 'updateReturnedLineItem'];
const SIMPLIFY_OPS = ['listJobs', 'listReturns', 'getReturn', 'findReturns'];
const PAGINATED_OPS = ['listJobs', 'findReturns'];

const ITEM_RETURN_JOB_STATUS_OPTIONS = [
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Finished', value: 'FINISHED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Open', value: 'OPEN' },
];
const ITEM_RETURN_STATUS_OPTIONS = [
	{ name: 'Announced', value: 'ANNOUNCED' },
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'Finished', value: 'FINISHED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Obsolete', value: 'OBSOLETE' },
	{ name: 'Open', value: 'OPEN' },
	{ name: 'Paused', value: 'PAUSED' },
	{ name: 'Waiting For Input', value: 'WAITING_FOR_INPUT' },
];
const LINE_ITEM_STATUS_OPTIONS = [
	{ name: 'Accepted', value: 'ACCEPTED' },
	{ name: 'Canceled', value: 'CANCELED' },
	{ name: 'In Progress', value: 'IN_PROGRESS' },
	{ name: 'Open', value: 'OPEN' },
	{ name: 'Rejected', value: 'REJECTED' },
	{ name: 'Waiting For Input', value: 'WAITING_FOR_INPUT' },
];

function show(operation: string[]): { show: { resource: string[]; operation: string[] } } {
	return { show: { resource: RESOURCE, operation } };
}

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
				{ displayName: 'Group', name: 'group', type: 'string', default: '' },
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
				{ displayName: 'Value', name: 'value', type: 'string', default: '' },
			],
		},
	],
};

/** A job line-item collection (`ItemReturnJobLineItemForCreation[]`). `delivered` is required. */
function jobLineItemsField(name: string, displayName: string, description: string): INodeProperties {
	return {
		displayName,
		name,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		displayOptions: show(['createJob']),
		description,
		options: [
			{
				name: 'item',
				displayName: 'Line Item',
				// Ordered for UX (identifiers first) rather than alphabetically.
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{ displayName: 'Tenant Article ID', name: 'tenantArticleId', type: 'string', required: true, default: '', placeholder: 'e.g. 4711', description: 'Reference to the article' },
					{ displayName: 'Title', name: 'title', type: 'string', required: true, default: '', placeholder: 'e.g. Cologne Water', description: 'Title of the article' },
					{ displayName: 'Delivered', name: 'delivered', type: 'number', required: true, default: 1, typeOptions: { minValue: 1 }, description: 'Quantity of this line item that was delivered' },
					{ displayName: 'Global Line Item ID', name: 'globalLineItemId', type: 'string', default: '', description: 'Links this line item to line items of other operational entities' },
					{ displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '', placeholder: 'e.g. https://example.com/image.png' },
					{ displayName: 'Weight', name: 'weight', type: 'number', default: 0, typeOptions: { minValue: 0 }, description: 'Article weight in grams. 0 to omit.' },
					localizedField('titleLocalized', 'Title Localized', 'Translations of the article title, keyed by locale'),
					ARTICLE_ATTRIBUTES_FIELD,
					{ displayName: 'Article Custom Attributes (JSON)', name: 'articleCustomAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the article' },
					{ displayName: 'Scannable Codes', name: 'scannableCodes', type: 'string', default: '', placeholder: 'e.g. 4711, 4712', description: 'Comma-separated codes for scanning this line item' },
					{ displayName: 'Service Job Refs', name: 'serviceJobRefs', type: 'string', default: '', placeholder: 'e.g. sj-1, sj-2', description: 'Comma-separated service job references' },
					RECORDABLE_ATTRIBUTES_FIELD,
					{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the line item' },
				],
			},
		],
	};
}

/** A returned line-item collection (`ItemReturnLineItemForCreation[]`), scoped to given operations. */
function returnedLineItemsField(operation: string[]): INodeProperties {
	return {
		displayName: 'Returned Line Items',
		name: 'returnedLineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Returned Line Item',
		default: {},
		required: true,
		displayOptions: show(operation),
		description: 'The line items being returned',
		options: [
			{
				name: 'item',
				displayName: 'Returned Line Item',
				// Ordered for UX (identifiers first) rather than alphabetically.
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{ displayName: 'Item Return Job Line Item Ref', name: 'itemReturnJobLineItemRef', type: 'string', required: true, default: '', description: 'ID of the item return job line item being returned' },
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						required: true,
						default: 'OPEN',
						options: LINE_ITEM_STATUS_OPTIONS,
					},
					{ displayName: 'Tenant Article ID', name: 'tenantArticleId', type: 'string', default: '' },
					{ displayName: 'Item Condition Comment', name: 'itemConditionComment', type: 'string', default: '', placeholder: 'e.g. Upper corner damaged' },
					localizedField('itemConditionLocalized', 'Item Condition Localized', 'Localized item condition text'),
					localizedField('decisionReasonLocalized', 'Decision Reason Localized', 'Localized decision reason'),
					{ displayName: 'Decision Reason Comment', name: 'decisionReasonComment', type: 'string', default: '' },
					{ displayName: 'Scanned Codes', name: 'scannedCodes', type: 'string', default: '', placeholder: 'e.g. 4711, 4712', description: 'Comma-separated scanned codes' },
					RECORDABLE_ATTRIBUTES_FIELD,
					{ displayName: 'Reasons (JSON)', name: 'reasons', type: 'json', default: '[]', description: 'Array of return reasons. See ItemReturnLineItemReason in the API reference.' },
					{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the returned line item' },
				],
			},
		],
	};
}

// ---------------------------------------------------------------------------
//  Operations
// ---------------------------------------------------------------------------

export const returnOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: RESOURCE } },
		options: [
			{ name: 'Create Item Return', value: 'createReturn', description: 'Add an item return to an item return job', action: 'Create an item return' },
			{ name: 'Create Item Return Job', value: 'createJob', description: 'Create an item return job', action: 'Create an item return job' },
			{ name: 'Get Item Return', value: 'getReturn', description: 'Retrieve a single item return', action: 'Get an item return' },
			{ name: 'Get Item Returns', value: 'findReturns', description: 'Retrieve many item returns across jobs', action: 'Get item returns' },
			{ name: 'List Item Return Jobs', value: 'listJobs', description: 'Retrieve many item return jobs', action: 'List item return jobs' },
			{ name: 'List Item Returns', value: 'listReturns', description: 'Retrieve the item returns of a job', action: 'List item returns' },
			{ name: 'Update Returned Line Item', value: 'updateReturnedLineItem', description: 'Update a single returned line item', action: 'Update a returned line item' },
			{ name: 'Update Returned Line Items', value: 'updateReturnedLineItems', description: 'Replace the returned line items of an item return', action: 'Update returned line items' },
		],
		default: 'listJobs',
	},
];

// ---------------------------------------------------------------------------
//  Fields
// ---------------------------------------------------------------------------

export const returnFields: INodeProperties[] = [
	// ----- identifiers -----
	{
		displayName: 'Item Return Job ID',
		name: 'itemReturnJobId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(JOB_ID_OPS),
		description: 'The item return job to operate on',
	},
	{
		displayName: 'Item Return ID',
		name: 'itemReturnId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(RETURN_ID_OPS),
		description: 'The item return to operate on',
	},
	{
		displayName: 'Returned Line Item ID',
		name: 'returnedLineItemId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(['updateReturnedLineItem']),
		description: 'The returned line item to update',
	},

	// ----- pagination + simplify -----
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: show(PAGINATED_OPS),
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: RESOURCE, operation: PAGINATED_OPS, returnAll: [false] } },
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(['listJobs']),
		options: [
			{ displayName: 'Anonymized', name: 'anonymized', type: 'boolean', default: false },
			{ displayName: 'Facility ID', name: 'facilityId', type: 'string', default: '' },
			{ displayName: 'Item Return Job Scannable Codes', name: 'itemReturnJobScannableCodes', type: 'string', default: '', placeholder: 'e.g. a, b', description: 'Comma-separated scannable codes of the job' },
			{ displayName: 'Item Return Job Status', name: 'itemReturnJobStatus', type: 'multiOptions', default: [], options: ITEM_RETURN_JOB_STATUS_OPTIONS },
			{ displayName: 'Item Return Scannable Codes', name: 'itemReturnScannableCodes', type: 'string', default: '', placeholder: 'e.g. a, b', description: 'Comma-separated scannable codes of the item return' },
			{ displayName: 'Item Return Status', name: 'itemReturnStatus', type: 'multiOptions', default: [], options: ITEM_RETURN_STATUS_OPTIONS },
			{ displayName: 'Search Term', name: 'searchTerm', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(['findReturns']),
		options: [
			{ displayName: 'Anonymized', name: 'anonymized', type: 'boolean', default: false },
			{ displayName: 'Facility Refs', name: 'facilityRefs', type: 'string', default: '', placeholder: 'e.g. f1, f2', description: 'Comma-separated facility references' },
			{ displayName: 'Item Return Line Item Status', name: 'itemReturnLineItemStatus', type: 'multiOptions', default: [], options: LINE_ITEM_STATUS_OPTIONS },
			{ displayName: 'Item Return Status', name: 'itemReturnStatus', type: 'multiOptions', default: [], options: ITEM_RETURN_STATUS_OPTIONS },
			{ displayName: 'Order By', name: 'orderBy', type: 'string', default: '', description: 'Attribute to order the result by' },
			{ displayName: 'Search Term', name: 'searchTerm', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: show(SIMPLIFY_OPS),
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},

	// ======================= CREATE ITEM RETURN JOB =======================
	{
		displayName: 'Origin Facility Refs',
		name: 'originFacilityRefs',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. f1, f2',
		displayOptions: show(['createJob']),
		description: 'Comma-separated references of the origin facilities',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		default: 'OPEN',
		displayOptions: show(['createJob']),
		options: ITEM_RETURN_JOB_STATUS_OPTIONS,
	},
	{
		displayName: 'Consumer Addresses',
		name: 'consumerAddresses',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Address',
		default: {},
		required: true,
		displayOptions: show(['createJob']),
		description: 'Consumer addresses for the return (at least one required)',
		options: [
			{
				name: 'address',
				displayName: 'Address',
				values: [
					{ displayName: 'Additional Address Info', name: 'additionalAddressInfo', type: 'string', default: '' },
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
					{ displayName: 'Company Name', name: 'companyName', type: 'string', default: '' },
					{ displayName: 'Country', name: 'country', type: 'string', default: '', placeholder: 'e.g. DE', description: 'Two-letter country code as per ISO 3166-1 alpha-2' },
					{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}' },
					{ displayName: 'Email', name: 'email', type: 'string', default: '', placeholder: 'name@example.com' },
					{ displayName: 'First Name', name: 'firstName', type: 'string', default: '' },
					{ displayName: 'House Number', name: 'houseNumber', type: 'string', default: '', placeholder: 'e.g. 42a' },
					{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '' },
					{ displayName: 'Latitude', name: 'latitude', type: 'number', default: 0, typeOptions: { numberPrecision: 6 }, description: 'Both latitude and longitude must be set together' },
					{ displayName: 'Longitude', name: 'longitude', type: 'number', default: 0, typeOptions: { numberPrecision: 6 }, description: 'Both latitude and longitude must be set together' },
					{ displayName: 'Personal Title', name: 'personalTitle', type: 'string', default: '' },
					{ displayName: 'Phone Numbers (JSON)', name: 'phoneNumbers', type: 'json', default: '[]', description: 'Array of phone numbers, e.g. [{"value":"+49...","type":"MOBILE"}]' },
					{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '', placeholder: 'e.g. 40764' },
					{ displayName: 'Province', name: 'province', type: 'string', default: '' },
					{ displayName: 'Salutation', name: 'salutation', type: 'string', default: '' },
					{ displayName: 'Street', name: 'street', type: 'string', default: '', placeholder: 'e.g. Hauptstr.' },
				],
			},
		],
	},
	jobLineItemsField('returnableLineItems', 'Returnable Line Items', 'The line items that can be returned'),
	jobLineItemsField('notReturnableLineItems', 'Not Returnable Line Items', 'The line items that cannot be returned'),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createJob']),
		options: [
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the item return job' },
			{ displayName: 'Process Ref', name: 'processRef', type: 'string', default: '' },
			{ displayName: 'Scannable Codes', name: 'scannableCodes', type: 'string', default: '', placeholder: 'e.g. a, b', description: 'Comma-separated scannable codes' },
			{ displayName: 'Short ID', name: 'shortId', type: 'string', default: '', placeholder: 'e.g. AS12' },
			{ displayName: 'Tenant Order ID', name: 'tenantOrderId', type: 'string', default: '' },
		],
	},
	{ displayName: 'Additional Body Fields (JSON)', name: 'additionalBodyFields', type: 'json', default: '{}', displayOptions: show(['createJob']), description: 'Advanced: raw JSON merged into the item return job. See ItemReturnJobForCreation.' },

	// ======================= CREATE ITEM RETURN =======================
	{
		displayName: 'Item Return Job Version',
		name: 'itemReturnJobVersion',
		type: 'number',
		required: true,
		default: 1,
		displayOptions: show(['createReturn', 'updateReturnedLineItems', 'updateReturnedLineItem']),
		description: 'Current version of the item return job, required for optimistic locking',
	},
	{
		displayName: 'Return Facility Ref',
		name: 'returnFacilityRef',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['createReturn']),
		description: 'Reference of the facility the items are returned to',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		default: 'ANNOUNCED',
		displayOptions: show(['createReturn']),
		options: ITEM_RETURN_STATUS_OPTIONS,
	},
	returnedLineItemsField(['createReturn', 'updateReturnedLineItems']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createReturn']),
		options: [
			{ displayName: 'Scannable Codes', name: 'scannableCodes', type: 'string', default: '', placeholder: 'e.g. a, b', description: 'Comma-separated scannable codes' },
		],
	},

	// ======================= UPDATE RETURNED LINE ITEM =======================
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['updateReturnedLineItem']),
		description: 'Changes to apply to the returned line item',
		options: [
			localizedField('decisionReasonLocalized', 'Decision Reason Localized', 'Localized decision reason'),
			{ displayName: 'Decision Reason Comment', name: 'decisionReasonComment', type: 'string', default: '' },
			{ displayName: 'Refund Currency', name: 'refundCurrency', type: 'string', default: '', placeholder: 'e.g. EUR', description: 'Currency for a fixed-value refund (ISO 4217)' },
			{ displayName: 'Refund Percent', name: 'refundPercent', type: 'number', default: 0, typeOptions: { minValue: 0, maxValue: 100 }, description: 'Percent of the line item price to refund. Use either percent or value, not both.' },
			{
				displayName: 'Refund Status',
				name: 'refundStatus',
				type: 'options',
				default: '',
				description: 'Set to add a refund to the line item',
				options: [
					{ name: '— Not Set —', value: '' },
					{ name: 'Closed', value: 'CLOSED' },
					{ name: 'In Progress', value: 'IN_PROGRESS' },
					{ name: 'Open', value: 'OPEN' },
				],
			},
			{ displayName: 'Refund Value', name: 'refundValue', type: 'number', default: 0, description: 'Fixed refund amount. Use either value or percent, not both.' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'ACCEPTED',
				options: LINE_ITEM_STATUS_OPTIONS,
			},
		],
	},
	{ displayName: 'Additional Body Fields (JSON)', name: 'additionalBodyFields', type: 'json', default: '{}', displayOptions: show(['updateReturnedLineItem']), description: 'Advanced: raw JSON merged into the update body. See ItemReturnLineItemForUpdate.' },
];
