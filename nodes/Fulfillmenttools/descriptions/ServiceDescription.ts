import type { INodeProperties } from 'n8n-workflow';

import {
	LINKED_SERVICE_JOB_STATUS_OPTIONS,
	SERVICE_CHANNEL_OPTIONS,
	SERVICE_JOB_STATUS_OPTIONS,
} from '../SearchConfigs';

const RESOURCE = ['service'];

const LINKED_ID_OPS = ['getLinked', 'createLink', 'createNestedLink'];
const CUSTOM_SERVICE_ID_OPS = ['getCustomService', 'updateCustomService', 'getFacilityCustomService'];
const FACILITY_OPS = ['listFacilityCustomServices', 'getFacilityCustomService'];
const SIMPLIFY_OPS = [
	'listLinked',
	'getLinked',
	'searchLinked',
	'listJobs',
	'getJob',
	'listCustomServices',
	'getCustomService',
	'listFacilityCustomServices',
	'getFacilityCustomService',
];
const PAGINATED_OPS = [
	'listLinked',
	'searchLinked',
	'listJobs',
	'listCustomServices',
	'listFacilityCustomServices',
];

/** Localized status / itemsRequired option sets for custom services. */
const CUSTOM_SERVICE_STATUS_OPTIONS = [
	{ name: 'Active', value: 'ACTIVE' },
	{ name: 'Inactive', value: 'INACTIVE' },
];
const ITEMS_REQUIRED_OPTIONS = [
	{ name: 'Mandatory', value: 'MANDATORY' },
	{ name: 'None', value: 'NONE' },
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

/** A top-level localized field scoped to given operations. */
function localizedFieldFor(
	name: string,
	displayName: string,
	description: string,
	operation: string[],
): INodeProperties {
	return { ...localizedField(name, displayName, description), displayOptions: show(operation) };
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

/** Article + shared fields for a service-job line item, with optional trailing extras. */
function articleValues(atEnd: INodeProperties[] = []): INodeProperties[] {
	return [
		{ displayName: 'Tenant Article ID', name: 'tenantArticleId', type: 'string', required: true, default: '', placeholder: 'e.g. 4711', description: 'Reference to the article' },
		{ displayName: 'Title', name: 'title', type: 'string', required: true, default: '', placeholder: 'e.g. Cologne Water', description: 'Title of the article' },
		{ displayName: 'Quantity', name: 'quantity', type: 'number', required: true, default: 1, typeOptions: { minValue: 1 }, description: 'Quantity of the item' },
		{ displayName: 'Secondary Quantity', name: 'secondaryQuantity', type: 'number', default: 0, typeOptions: { minValue: 0 }, description: 'Secondary quantity, e.g. weight when quantity is a count. 0 to omit.' },
		{ displayName: 'Measurement Unit Key', name: 'measurementUnitKey', type: 'string', default: '', placeholder: 'e.g. pcs' },
		{ displayName: 'Secondary Measurement Unit Key', name: 'secondaryMeasurementUnitKey', type: 'string', default: '', placeholder: 'e.g. g' },
		{ displayName: 'Scannable Codes', name: 'scannableCodes', type: 'string', default: '', placeholder: 'e.g. 4711, 4712', description: 'Comma-separated codes for scanning this line item' },
		{ displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '', placeholder: 'e.g. https://example.com/image.png' },
		{ displayName: 'Weight', name: 'weight', type: 'number', default: 0, typeOptions: { minValue: 0 }, description: 'Article weight in grams. 0 to omit.' },
		localizedField('titleLocalized', 'Title Localized', 'Translations of the article title, keyed by locale'),
		ARTICLE_ATTRIBUTES_FIELD,
		{ displayName: 'Article Custom Attributes (JSON)', name: 'articleCustomAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the article' },
		...atEnd,
	];
}

// ---------------------------------------------------------------------------
//  Operations
// ---------------------------------------------------------------------------

export const serviceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: RESOURCE } },
		options: [
			{ name: 'Create Custom Service', value: 'createCustomService', description: 'Create a custom service', action: 'Create a custom service' },
			{ name: 'Create Nested Service Job Link', value: 'createNestedLink', description: 'Add a service job link nested under another link', action: 'Create a nested service job link' },
			{ name: 'Create Service Job', value: 'createJob', description: 'Create a service job', action: 'Create a service job' },
			{ name: 'Create Service Job Link', value: 'createLink', description: 'Add a service job to a linked service jobs group', action: 'Create a service job link' },
			{ name: 'Get Custom Service', value: 'getCustomService', description: 'Retrieve a single custom service', action: 'Get a custom service' },
			{ name: 'Get Facility Custom Service', value: 'getFacilityCustomService', description: 'Retrieve a facility custom service connection', action: 'Get a facility custom service' },
			{ name: 'Get Linked Service Jobs', value: 'getLinked', description: 'Retrieve a single linked service jobs group', action: 'Get linked service jobs' },
			{ name: 'Get Service Job', value: 'getJob', description: 'Retrieve a single service job', action: 'Get a service job' },
			{ name: 'List Custom Services', value: 'listCustomServices', description: 'Retrieve many custom services', action: 'List custom services' },
			{ name: 'List Facility Custom Services', value: 'listFacilityCustomServices', description: 'Retrieve the custom services connected to a facility', action: 'List facility custom services' },
			{ name: 'List Linked Service Jobs', value: 'listLinked', description: 'Retrieve many linked service jobs groups', action: 'List linked service jobs' },
			{ name: 'List Service Jobs', value: 'listJobs', description: 'Retrieve many service jobs', action: 'List service jobs' },
			{ name: 'Search Linked Service Jobs', value: 'searchLinked', description: 'Find linked service jobs matching a set of conditions', action: 'Search linked service jobs' },
			{ name: 'Update Custom Service', value: 'updateCustomService', description: 'Update a custom service', action: 'Update a custom service' },
		],
		default: 'listJobs',
	},
];

// ---------------------------------------------------------------------------
//  Fields
// ---------------------------------------------------------------------------

export const serviceFields: INodeProperties[] = [
	// ----- identifiers -----
	{
		displayName: 'Linked Service Jobs ID',
		name: 'linkedServiceJobsId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(LINKED_ID_OPS),
		description: 'The linked service jobs group to operate on',
	},
	{
		displayName: 'Service Job Link ID',
		name: 'serviceJobLinkId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(['createNestedLink']),
		description: 'The existing service job link to nest the new link under',
	},
	{
		displayName: 'Service Job ID',
		name: 'serviceJobId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(['getJob']),
		description: 'The service job to retrieve',
	},

	// ----- create link / nested link -----
	{
		displayName: 'Service Job Ref',
		name: 'serviceJobRef',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 0ed803c2-fa20-48d9-9c1b-0d243937a9ad',
		displayOptions: show(['createLink', 'createNestedLink']),
		description: 'ID of the service job to add to the linked service jobs group',
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
		displayOptions: show(['listLinked']),
		options: [
			{ displayName: 'Channel', name: 'channel', type: 'options', default: 'SHIPPING', options: SERVICE_CHANNEL_OPTIONS },
			{ displayName: 'End Target Time', name: 'endTargetTime', type: 'dateTime', default: '' },
			{ displayName: 'Facility IDs', name: 'facilityIds', type: 'string', default: '', placeholder: 'e.g. f1, f2', description: 'Comma-separated facility IDs' },
			{ displayName: 'Modified By Username', name: 'modifiedByUsername', type: 'string', default: '' },
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				default: 'TARGET_TIME_ASC',
				options: [
					{ name: 'Last Modified (Ascending)', value: 'LAST_MODIFIED_ASC' },
					{ name: 'Last Modified (Descending)', value: 'LAST_MODIFIED_DESC' },
					{ name: 'Target Time (Ascending)', value: 'TARGET_TIME_ASC' },
					{ name: 'Target Time (Descending)', value: 'TARGET_TIME_DESC' },
				],
			},
			{ displayName: 'Search Term', name: 'searchTerm', type: 'string', default: '' },
			{ displayName: 'Start Target Time', name: 'startTargetTime', type: 'dateTime', default: '' },
			{ displayName: 'Status', name: 'status', type: 'multiOptions', default: [], options: LINKED_SERVICE_JOB_STATUS_OPTIONS },
		],
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(['listJobs']),
		options: [
			{ displayName: 'Assigned User', name: 'assignedUser', type: 'string', default: '', description: 'User ID or username assigned to the service job' },
			{ displayName: 'Channel', name: 'channel', type: 'options', default: 'SHIPPING', options: SERVICE_CHANNEL_OPTIONS },
			{ displayName: 'End Target Time', name: 'endTargetTime', type: 'dateTime', default: '' },
			{ displayName: 'Facility Ref', name: 'facilityRef', type: 'string', default: '' },
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				default: 'TARGET_TIME_ASC',
				options: [
					{ name: 'Last Modified (Ascending)', value: 'LAST_MODIFIED_ASC' },
					{ name: 'Last Modified (Descending)', value: 'LAST_MODIFIED_DESC' },
					{ name: 'Target Time (Ascending)', value: 'TARGET_TIME_ASC' },
					{ name: 'Target Time (Descending)', value: 'TARGET_TIME_DESC' },
				],
			},
			{ displayName: 'Search Term', name: 'searchTerm', type: 'string', default: '' },
			{ displayName: 'Start Target Time', name: 'startTargetTime', type: 'dateTime', default: '' },
			{ displayName: 'Status', name: 'status', type: 'multiOptions', default: [], options: SERVICE_JOB_STATUS_OPTIONS },
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

	// ======================= CREATE SERVICE JOB =======================
	{
		displayName: 'Facility',
		name: 'facilityRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: show(['createJob']),
		description: 'The facility the service job is executed in',
		modes: [
			{ displayName: 'From List', name: 'list', type: 'list', typeOptions: { searchListMethod: 'searchFacilities', searchable: true } },
			{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63' },
		],
	},
	{
		displayName: 'Target Time',
		name: 'targetTime',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: show(['createJob']),
		description: 'When the service job is expected to be finished',
	},
	{
		displayName: 'Line Items',
		name: 'lineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		displayOptions: show(['createJob']),
		description: 'Items to be processed as part of this service job',
		options: [
			{
				name: 'item',
				displayName: 'Line Item',
				values: articleValues([
					{ displayName: 'Global Line Item ID', name: 'globalLineItemId', type: 'string', default: '', description: 'Links this line item to line items of other operational entities' },
					RECORDABLE_ATTRIBUTES_FIELD,
					{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the line item' },
				]),
			},
		],
	},
	{
		displayName: 'Required Line Items',
		name: 'requiredLineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Required Line Item',
		default: {},
		displayOptions: show(['createJob']),
		description: 'Items that are required for this service job',
		options: [
			{
				name: 'item',
				displayName: 'Required Line Item',
				values: articleValues(),
			},
		],
	},
	{
		displayName: 'Additional Information',
		name: 'additionalInformation',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Information',
		default: {},
		displayOptions: show(['createJob']),
		description: 'Additional information to be collected for this service job',
		options: [
			{
				name: 'info',
				displayName: 'Information',
				values: [
					{ displayName: 'Additional Information Ref', name: 'additionalInformationRef', type: 'string', default: '', description: 'ID of the additional information. Either this or the tenant ref is required.' },
					{ displayName: 'Tenant Additional Information Ref', name: 'tenantAdditionalInformationRef', type: 'string', default: '', description: 'External ID of the additional information. Either this or the ref is required.' },
					{
						displayName: 'Value Type',
						name: 'valueType',
						type: 'options',
						default: 'string',
						options: [
							{ name: 'Boolean', value: 'boolean' },
							{ name: 'Number', value: 'number' },
							{ name: 'String', value: 'string' },
						],
					},
					{ displayName: 'Value', name: 'value', type: 'string', default: '', description: 'Value of the additional information, coerced to the chosen type' },
				],
			},
		],
	},
	{
		displayName: 'Assigned Users',
		name: 'assignedUsers',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Assigned User',
		default: {},
		displayOptions: show(['createJob']),
		description: 'Users assigned to this service job',
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
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createJob']),
		options: [
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the service job' },
			{ displayName: 'Custom Service Ref', name: 'customServiceRef', type: 'string', default: '', description: 'ID of the custom service. Either this or the tenant custom service ID must be set.' },
			{ displayName: 'Operative Process Ref', name: 'operativeProcessRef', type: 'string', default: '' },
			{ displayName: 'Process Ref', name: 'processRef', type: 'string', default: '', description: 'ID of the process this service job belongs to' },
			{ displayName: 'Service Job Link Ref', name: 'serviceJobLinkRef', type: 'string', default: '' },
			{ displayName: 'Short ID', name: 'shortId', type: 'string', default: '', placeholder: 'e.g. KD-12-1' },
			{ displayName: 'Tenant Custom Service ID', name: 'tenantCustomServiceId', type: 'string', default: '', description: 'Tenant ID of the custom service. Either this or the custom service ref must be set.' },
			{ displayName: 'Tenant Order ID', name: 'tenantOrderId', type: 'string', default: '', placeholder: 'e.g. ocff-order-100' },
		],
	},
	{
		displayName: 'Additional Body Fields (JSON)',
		name: 'additionalBodyFields',
		type: 'json',
		default: '{}',
		displayOptions: show(['createJob']),
		description: 'Advanced: raw JSON merged into the service job for any field not listed above. See ServiceJobForCreation.',
	},

	// ======================= CUSTOM SERVICE IDENTIFIERS =======================
	{
		displayName: 'Facility',
		name: 'facilityRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: show(FACILITY_OPS),
		description: 'The facility whose custom services to operate on',
		modes: [
			{ displayName: 'From List', name: 'list', type: 'list', typeOptions: { searchListMethod: 'searchFacilities', searchable: true } },
			{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63' },
		],
	},
	{
		displayName: 'Custom Service ID',
		name: 'customServiceId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 41d43211-g5a1-gg22-a716-ba095e30ds1d',
		displayOptions: show(CUSTOM_SERVICE_ID_OPS),
		description: 'The custom service to operate on',
	},

	// ======================= LIST CUSTOM SERVICES FILTER =======================
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(['listCustomServices']),
		options: [
			{ displayName: 'Tenant Custom Service ID', name: 'tenantCustomServiceId', type: 'string', default: '' },
		],
	},

	// ======================= CREATE CUSTOM SERVICE =======================
	localizedFieldFor('nameLocalized', 'Name', 'Localized names of the custom service (required)', ['createCustomService']),
	{
		displayName: 'Status',
		name: 'status',
		type: 'options',
		required: true,
		default: 'ACTIVE',
		displayOptions: show(['createCustomService']),
		options: CUSTOM_SERVICE_STATUS_OPTIONS,
	},
	{
		displayName: 'Items Required',
		name: 'itemsRequired',
		type: 'options',
		required: true,
		default: 'NONE',
		displayOptions: show(['createCustomService']),
		description: 'Whether items are required for executing a service job of this custom service',
		options: ITEMS_REQUIRED_OPTIONS,
	},
	{
		displayName: 'Additional Information',
		name: 'additionalInformation',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Information',
		default: {},
		displayOptions: show(['createCustomService']),
		description: 'Additional information fields collected when executing this custom service',
		options: [
			{
				name: 'info',
				displayName: 'Information',
				values: [
					localizedField('nameLocalized', 'Name Localized', 'Localized names (required)'),
					localizedField('descriptionLocalized', 'Description Localized', 'Localized descriptions'),
					{
						displayName: 'Value Type',
						name: 'valueType',
						type: 'options',
						default: 'STRING',
						options: [
							{ name: 'Boolean', value: 'BOOLEAN' },
							{ name: 'Multiline String', value: 'INPUT_MULTILINE_STRING' },
							{ name: 'No Value', value: 'NOVALUE' },
							{ name: 'Number', value: 'NUMBER' },
							{ name: 'String', value: 'STRING' },
						],
					},
					{ displayName: 'Mandatory', name: 'isMandatory', type: 'boolean', default: false, description: 'Whether filling in this additional information is mandatory' },
					{ displayName: 'Tenant Additional Information ID', name: 'tenantAdditionalInformationId', type: 'string', default: '', description: 'External ID, unique per custom service' },
				],
			},
		],
	},
	localizedFieldFor('descriptionLocalized', 'Description', 'Localized descriptions of the custom service', ['createCustomService']),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createCustomService']),
		options: [
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the custom service' },
			{ displayName: 'Execution Time (Minutes)', name: 'executionTimeInMin', type: 'number', default: 0, typeOptions: { minValue: 0 }, description: 'Time in minutes the custom service takes to execute' },
			{ displayName: 'Image Refs', name: 'imageRefs', type: 'string', default: '', placeholder: 'e.g. https://host/a.jpg, https://host/b.jpg', description: 'Comma-separated links to images for this custom service' },
			{ displayName: 'Items Returnable', name: 'itemsReturnable', type: 'boolean', default: false, description: 'Whether the items are returnable after execution' },
			{ displayName: 'Tenant Custom Service ID', name: 'tenantCustomServiceId', type: 'string', default: '' },
		],
	},
	{ displayName: 'Additional Body Fields (JSON)', name: 'additionalBodyFields', type: 'json', default: '{}', displayOptions: show(['createCustomService']), description: 'Advanced: raw JSON merged into the custom service. See CustomServiceForCreation.' },

	// ======================= UPDATE CUSTOM SERVICE =======================
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		required: true,
		default: 1,
		displayOptions: show(['updateCustomService']),
		description: 'Current version, required for optimistic locking. Retrieve it first with the Get operation.',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['updateCustomService']),
		description: 'Fields to change on the custom service. Only the fields you set are modified.',
		options: [
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}' },
			localizedField('descriptionLocalized', 'Description Localized', 'Localized descriptions of the custom service'),
			{ displayName: 'Execution Time (Minutes)', name: 'executionTimeInMin', type: 'number', default: 0, typeOptions: { minValue: 0 } },
			{ displayName: 'Items Required', name: 'itemsRequired', type: 'options', default: 'NONE', options: ITEMS_REQUIRED_OPTIONS },
			{ displayName: 'Items Returnable', name: 'itemsReturnable', type: 'boolean', default: false },
			localizedField('nameLocalized', 'Name Localized', 'Localized names of the custom service'),
			{ displayName: 'Status', name: 'status', type: 'options', default: 'ACTIVE', options: CUSTOM_SERVICE_STATUS_OPTIONS },
			{ displayName: 'Tenant Custom Service ID', name: 'tenantCustomServiceId', type: 'string', default: '' },
		],
	},
	{ displayName: 'Additional Body Fields (JSON)', name: 'additionalBodyFields', type: 'json', default: '{}', displayOptions: show(['updateCustomService']), description: 'Advanced: raw JSON merged into the update body. See CustomServiceForUpdate.' },
];
