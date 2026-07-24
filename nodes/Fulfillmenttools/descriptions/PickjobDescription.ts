import type { INodeProperties } from 'n8n-workflow';

import { PICKJOB_STATUS_OPTIONS } from '../SearchConfigs';

const RESOURCE = ['pickjob'];

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

/** A Facility resourceLocator shared by the operations that need one. */
function facilityLocator(operations: string[], description: string): INodeProperties {
	return {
		displayName: 'Facility',
		name: 'facilityRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: operations,
			},
		},
		description,
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
	};
}

/**
 * Operations available for the Pick Job resource, covering the Picking
 * (Operations) endpoints: pick jobs, their delivery notes, and pick runs.
 */
export const pickjobOperations: INodeProperties[] = [
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
				description: 'Create a pick job',
				action: 'Create a pick job',
			},
			{
				name: 'Create Pick Run',
				value: 'createPickRun',
				description: 'Create a pick run from one or more pick jobs',
				action: 'Create a pick run',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single pick job',
				action: 'Get a pick job',
			},
			{
				name: 'Get Delivery Note',
				value: 'getDeliveryNote',
				description: 'Download the delivery note PDF of a pick job',
				action: 'Get a pick job delivery note',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many pick jobs',
				action: 'Get many pick jobs',
			},
			{
				name: 'Get Pick Run',
				value: 'getPickRun',
				description: 'Retrieve a single pick run',
				action: 'Get a pick run',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Find pick jobs matching a set of conditions',
				action: 'Search pick jobs',
			},
			{
				name: 'Update Pick Run',
				value: 'updatePickRun',
				description: 'Modify the line items of a pick run',
				action: 'Update a pick run',
			},
			{
				name: 'Update Pick Run Pick Jobs',
				value: 'updatePickRunPickJobs',
				description: 'Remove a pick job from a pick run',
				action: 'Update pick jobs of a pick run',
			},
		],
		default: 'search',
	},
];

/** Fields for the Pick Job resource. */
export const pickjobFields: INodeProperties[] = [
	// ----------------------------------
	//   pick job identifier (get / getDeliveryNote)
	// ----------------------------------
	{
		displayName: 'Pick Job ID',
		name: 'pickJobId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get', 'getDeliveryNote'],
			},
		},
		description: 'The pick job to operate on',
	},

	// ----------------------------------
	//   pick run identifier
	// ----------------------------------
	{
		displayName: 'Pick Run ID',
		name: 'pickRunId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getPickRun', 'updatePickRun', 'updatePickRunPickJobs'],
			},
		},
		description: 'The pick run to operate on',
	},

	// ----------------------------------
	//   getDeliveryNote — locale + output
	// ----------------------------------
	{
		displayName: 'Locale',
		name: 'locale',
		type: 'string',
		default: '',
		placeholder: 'e.g. de_DE',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getDeliveryNote'],
			},
		},
		description: 'Optional locale for the delivery note. If unset, the default locale is used.',
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
				operation: ['getDeliveryNote'],
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
			{
				displayName: 'Assigned User',
				name: 'assignedUser',
				type: 'string',
				default: '',
				description: 'User ID or username assigned to the pick job',
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
			{
				displayName: 'Consumer Name',
				name: 'consumerName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'End Order Date',
				name: 'endOrderDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'End Target Time',
				name: 'endTargetTime',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Facility Ref',
				name: 'facilityRef',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Order Ref',
				name: 'orderRef',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				default: '',
				placeholder: 'e.g. R456728546',
				description: 'Searches tenantOrderId, consumerName, tenantArticleId and more',
			},
			{
				displayName: 'Start Order Date',
				name: 'startOrderDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Start Target Time',
				name: 'startTargetTime',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: PICKJOB_STATUS_OPTIONS,
			},
			{
				displayName: 'Tenant Order ID',
				name: 'tenantOrderId',
				type: 'string',
				default: '',
			},
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
	//   create pick job
	// ----------------------------------
	facilityLocator(['create'], 'The facility that should fulfill the pick job'),
	{
		displayName: 'Order Date',
		name: 'orderDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'The date the order was created in the supplying system',
	},
	{
		displayName: 'Pick Line Items',
		name: 'pickLineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Pick Line Item',
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'The articles to pick',
		options: [
			{
				name: 'item',
				displayName: 'Pick Line Item',
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
						description: 'Reference to the article to pick',
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
						description: 'Quantity of the article to pick',
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
						displayName: 'Custom Attributes (JSON)',
						name: 'customAttributes',
						type: 'json',
						default: '{}',
						description: 'Free-form attributes stored on the line item',
					},
					{
						displayName: 'Allowed Substitutes (JSON)',
						name: 'allowedSubstitutes',
						type: 'json',
						default: '[]',
						description: 'Array of substitute articles. See Substitute in the API reference.',
					},
					{
						displayName: 'Partial Stock Locations (JSON)',
						name: 'partialStockLocations',
						type: 'json',
						default: '[]',
						description:
							'Array of stock locations to pick from. See PickJobLineItemPartialStockLocationForCreation in the API reference.',
					},
					{
						displayName: 'Measurement Validation (JSON)',
						name: 'measurementValidation',
						type: 'json',
						default: '{}',
						description:
							'Over/short pick tolerances. See MeasurementValidation in the API reference.',
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
							'Advanced: raw JSON merged into the line item for anything else. See PickLineItemForCreation in the API reference.',
					},
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
				description: 'Free-form attributes stored on the pick job',
			},
			{
				displayName: 'Operative Process Ref',
				name: 'operativeProcessRef',
				type: 'string',
				default: '',
				description: 'Reference to the operative process this pick job belongs to',
			},
			{
				displayName: 'Order Ref',
				name: 'orderRef',
				type: 'string',
				default: '',
				description: 'ID of the order that leads to this pick job. Must exist in the system.',
			},
			{
				displayName: 'Payment Currency',
				name: 'paymentCurrency',
				type: 'string',
				default: '',
				placeholder: 'e.g. EUR',
				description: 'Currency the consumer paid with (payment information)',
			},
			{
				displayName: 'Picking Start Latest At',
				name: 'startLatestAt',
				type: 'dateTime',
				default: '',
				description: 'The latest time this pick job should be started (picking times)',
			},
			{
				displayName: 'Preferred Picking Methods',
				name: 'preferredPickingMethods',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Batch', value: 'BATCH' },
					{ name: 'Multi Order', value: 'MULTI_ORDER' },
					{ name: 'Single Order', value: 'SINGLE_ORDER' },
				],
			},
			{
				displayName: 'Process ID',
				name: 'processId',
				type: 'string',
				default: '',
				description: 'ID of the global process related to this pick job',
			},
			{
				displayName: 'Routing Plan Ref',
				name: 'routingPlanRef',
				type: 'string',
				default: '',
				description: 'Reference to the routing plan that created this pick job',
			},
			{
				displayName: 'Short ID',
				name: 'shortId',
				type: 'string',
				default: '',
				placeholder: 'e.g. AS12',
				description: 'A short identifier that helps assign a pick job to a customer',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: PICKJOB_STATUS_OPTIONS,
			},
			{
				displayName: 'Tenant Order ID',
				name: 'tenantOrderId',
				type: 'string',
				default: '',
				placeholder: 'e.g. R456728546',
				description: "Reference number in the tenant's own system",
			},
		],
	},
	{
		...tagsField(),
		name: 'pickJobTags',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'Tags for the pick job. Only allowed when no process is related to it.',
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
		description: 'Users assigned to this pick job',
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
	{
		displayName: 'Delivery Information (JSON)',
		name: 'deliveryInformation',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description:
			'Delivery channel and its collect/shipping details (carrier, addresses). See PickjobDeliveryInformationForCreation in the API reference.',
	},
	{
		displayName: 'Expected Pick Line Items (JSON)',
		name: 'expectedPickLineItems',
		type: 'json',
		default: '[]',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description:
			'Array of expected pick line items. See ExpectedPickLineItemForCreation in the API reference.',
	},
	{
		displayName: 'Stickers (JSON)',
		name: 'stickers',
		type: 'json',
		default: '[]',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description: 'Array of stickers for the pick job. See Sticker in the API reference.',
	},
	{
		displayName: 'Workflow Information (JSON)',
		name: 'workflowInformation',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create'],
			},
		},
		description:
			'Workflow instance/node references. See WorkflowInformation in the API reference.',
	},
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
			'Advanced: raw JSON merged into the pick job for any field not listed above. See PickJobForCreation in the API reference.',
	},

	// ----------------------------------
	//   create pick run
	// ----------------------------------
	facilityLocator(['createPickRun'], 'The facility the pick run belongs to'),
	{
		displayName: 'Pick Job Refs',
		name: 'pickJobRefs',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. ref-1, ref-2',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['createPickRun'],
			},
		},
		description: 'Comma-separated references of the pick jobs to include in the run',
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
				operation: ['createPickRun'],
			},
		},
		options: [
			{
				displayName: 'Pick Run Type',
				name: 'pickRunType',
				type: 'options',
				default: 'batch',
				options: [
					{ name: 'Batch', value: 'batch' },
					{ name: 'Multi Order', value: 'multiOrder' },
				],
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: [
					{ name: 'Canceled', value: 'CANCELED' },
					{ name: 'Closed', value: 'CLOSED' },
					{ name: 'In Progress', value: 'IN_PROGRESS' },
					{ name: 'Obsolete', value: 'OBSOLETE' },
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Paused', value: 'PAUSED' },
				],
			},
		],
	},

	// ----------------------------------
	//   update pick run — line item modifications
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
				operation: ['updatePickRun', 'updatePickRunPickJobs'],
			},
		},
		description:
			'Current version of the pick run, required for optimistic locking. Retrieve it first with the Get Pick Run operation.',
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
				operation: ['updatePickRun'],
			},
		},
		description: 'Changes to apply to the pick run line items',
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
						description: 'ID of the pick run line item to modify',
					},
					{
						displayName: 'Picked',
						name: 'picked',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Amount of articles that were picked for this line',
					},
					{
						displayName: 'Secondary Picked',
						name: 'secondaryPicked',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Secondary amount of articles that were picked for this line',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: 'OPEN',
						options: [
							{ name: 'Closed', value: 'CLOSED' },
							{ name: 'In Progress', value: 'IN_PROGRESS' },
							{ name: 'Open', value: 'OPEN' },
						],
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
				operation: ['updatePickRun'],
			},
		},
		description:
			'Advanced: extra patch actions appended after the modifications above. See PickRunPatchAction in the API reference.',
	},

	// ----------------------------------
	//   update pick run pick jobs
	// ----------------------------------
	{
		displayName: 'Pick Job Ref to Remove',
		name: 'pickJobRef',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['updatePickRunPickJobs'],
			},
		},
		description: 'Reference of the pick job to remove from the pick run',
	},
];
