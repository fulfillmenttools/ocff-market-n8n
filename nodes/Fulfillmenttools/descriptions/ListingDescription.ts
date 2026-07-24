import type { INodeProperties } from 'n8n-workflow';

import { LISTING_STATUS_OPTIONS, OUT_OF_STOCK_BEHAVIOUR_OPTIONS } from '../SearchConfigs';

const RESOURCE = ['listing'];

/**
 * A localized-text field (`LocaleString`, a locale→value map) rendered as a
 * repeatable Locale + Value collection. Reused for titles and attribute values.
 */
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
						description: 'Locale code, e.g. en_US or de_DE',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
					},
				],
			},
		],
	};
}

/** The Scanning Rules field (`ScanningRuleConfiguration`), a repeatable type + priority list. */
const SCANNING_RULES_FIELD: INodeProperties = {
	displayName: 'Scanning Rules',
	name: 'scanningRule',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Scanning Rule',
	default: {},
	description: 'How items should be scanned during picking. Lowest priority is most preferable.',
	options: [
		{
			name: 'rule',
			displayName: 'Scanning Rule',
			values: [
				{
					displayName: 'Scanning Rule Type',
					name: 'scanningRuleType',
					type: 'options',
					required: true,
					default: 'ARTICLE',
					options: [
						{ name: 'Article', value: 'ARTICLE' },
						{ name: 'Location', value: 'LOCATION' },
					],
				},
				{
					displayName: 'Priority',
					name: 'priority',
					type: 'number',
					required: true,
					default: 0,
					typeOptions: { minValue: 0 },
					description: 'Ranks scanning rule types against each other. Lowest is most preferable.',
				},
			],
		},
	],
};

/** The Stock Properties field (`{ [key]: StockPropertyDefinition }`), a repeatable keyed list. */
const STOCK_PROPERTIES_FIELD: INodeProperties = {
	displayName: 'Stock Properties',
	name: 'stockProperties',
	type: 'fixedCollection',
	typeOptions: { multipleValues: true },
	placeholder: 'Add Stock Property',
	default: {},
	description: 'Definitions of stock properties captured for this article',
	options: [
		{
			name: 'property',
			displayName: 'Stock Property',
			values: [
				{
					displayName: 'Key',
					name: 'key',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. bestBefore',
					description: 'Name of the stock property',
				},
				{
					displayName: 'Input Type',
					name: 'inputType',
					type: 'options',
					required: true,
					default: 'TEXT',
					options: [
						{ name: 'Date', value: 'DATE' },
						{ name: 'Text', value: 'TEXT' },
					],
				},
				{
					displayName: 'Required',
					name: 'required',
					type: 'boolean',
					default: false,
					description: 'Whether this property must be provided',
				},
				{
					displayName: 'Default Value',
					name: 'defaultValue',
					type: 'string',
					default: '',
					description: 'Optional default value. {{NOW}} is replaced with the current timestamp.',
				},
			],
		},
	],
};

/**
 * The Recordable Attributes field (`ListingRecordableAttributeForCreation[]`).
 * The localized key is entered as one locale + value pair for the common case.
 */
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
			values: [
				{
					displayName: 'Key Locale',
					name: 'keyLocale',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. en_US',
					description: 'Locale of the localized key',
				},
				{
					displayName: 'Localized Key',
					name: 'localizedKey',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. Country of origin',
					description: 'The key text in the given locale',
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
					description: 'Whether the value has to be recorded',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
					placeholder: 'e.g. Germany',
					description: 'Optional pre-filled value of the attribute',
				},
			],
		},
	],
};

/** The Tags field (`TagReference[]`), rendered as a repeatable ID + Value collection. */
const TAGS_FIELD: INodeProperties = {
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
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					required: true,
					default: '',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					required: true,
					default: '',
				},
			],
		},
	],
};

/** The Attributes field (`ListingAttributeItem[]`), rendered as a repeatable collection. */
const ATTRIBUTES_FIELD: INodeProperties = {
	displayName: 'Attributes',
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
			// Ordered for UX (identifiers first) rather than alphabetically.
			// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
			values: [
				{
					displayName: 'Key',
					name: 'key',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. %%subtitle%%',
					description: 'Key of the attribute. Some keys such as %%subtitle%% have special meaning.',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					required: true,
					default: '',
					placeholder: 'e.g. 585er Gold',
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
					displayName: 'Category',
					name: 'category',
					type: 'options',
					default: 'miscellaneous',
					description: 'Category used by fulfillmenttools to customize processes',
					options: [
						{ name: 'Base Price', value: 'basePrice' },
						{ name: 'Carrier Service', value: 'carrierService' },
						{ name: 'Customs', value: 'customs' },
						{ name: 'Descriptive', value: 'descriptive' },
						{ name: 'Dimensions', value: 'dimensions' },
						{ name: 'Discount', value: 'discount' },
						{ name: 'Final Line Item Price', value: 'finalLineItemPrice' },
						{ name: 'Final Unit Price', value: 'finalUnitPrice' },
						{ name: 'Insurance', value: 'insurance' },
						{ name: 'Miscellaneous', value: 'miscellaneous' },
						{ name: 'Picking Sequence', value: 'pickingSequence' },
						{ name: 'Sales Price', value: 'salesPrice' },
						{ name: 'Shop', value: 'shop' },
						{ name: 'Subtotal After Discounts', value: 'subtotalAfterDiscounts' },
						{ name: 'Subtotal Before Discounts', value: 'subtotalBeforeDiscounts' },
						{ name: 'Surcharge', value: 'surcharge' },
						{ name: 'Tax', value: 'tax' },
					],
				},
				{
					displayName: 'Priority',
					name: 'priority',
					type: 'number',
					default: 1001,
					typeOptions: { minValue: 1, maxValue: 1001 },
					description: 'Priority within the category. Lower is higher priority; default is 1001.',
				},
			],
		},
	],
};

/** Operations that address a single listing by facility + tenant article ID. */
const SINGLE_LISTING_OPERATIONS = ['get', 'update', 'delete'];

/**
 * The scalar and structured fields shared by every listing write operation. Used
 * both inside the per-listing fixedCollections (create per facility, bulk upsert)
 * and, minus `title`, inside the single-listing update collection.
 *
 * Kept in sync with `applyListingFields` in `ListingFunctions.ts`.
 */
function listingCommonFields(options: {
	includeTitle: boolean;
	includeRecordable: boolean;
}): INodeProperties[] {
	const fields: INodeProperties[] = [];

	if (options.includeTitle) {
		fields.push({
			displayName: 'Title',
			name: 'title',
			type: 'string',
			default: '',
			placeholder: 'e.g. Adidas Superstar',
			description: 'A title describing the article',
		});
	}

	return [
		...fields,
		ATTRIBUTES_FIELD,
		{
			displayName: 'Category Refs',
			name: 'categoryRefs',
			type: 'string',
			default: '',
			placeholder: 'e.g. cat-1, cat-2',
			description: 'Comma-separated references to categories the listing belongs to',
		},
		{
			displayName: 'Custom Attributes (JSON)',
			name: 'customAttributes',
			type: 'json',
			default: '{}',
			description: 'Free-form attributes stored on the listing',
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
			displayName: 'Legal HS Code',
			name: 'legalHsCode',
			type: 'string',
			default: '',
			placeholder: 'e.g. 6403990000',
			description: 'Harmonized System code used for customs',
		},
		{
			displayName: 'Measurement Unit Key',
			name: 'measurementUnitKey',
			type: 'string',
			default: '',
			placeholder: 'e.g. liter',
			description: 'Identifier for the item unit of measurement',
		},
		{
			displayName: 'Out Of Stock Behaviour',
			name: 'outOfStockBehaviour',
			type: 'options',
			default: 'NONE',
			options: OUT_OF_STOCK_BEHAVIOUR_OPTIONS,
		},
		{
			displayName: 'Out Of Stock Behaviour By Contexts (JSON)',
			name: 'outOfStockBehaviourByContexts',
			type: 'json',
			default: '[]',
			description:
				'Alpha: context-specific out-of-stock behaviours. See OutOfStockBehaviourByContext in the API reference.',
		},
		{
			displayName: 'Preorder Availability Start',
			name: 'preorderAvailabilityStart',
			type: 'dateTime',
			default: '',
			description:
				'Alpha: start of the preorder availability timeframe (part of the out-of-stock config)',
		},
		{
			displayName: 'Restockable In Days',
			name: 'restockableInDays',
			type: 'number',
			default: 0,
			typeOptions: { minValue: 0 },
			description: 'Alpha: number of days until restock (part of the out-of-stock config)',
		},
		...(options.includeRecordable ? [RECORDABLE_ATTRIBUTES_FIELD] : []),
		{
			displayName: 'Scannable Codes',
			name: 'scannableCodes',
			type: 'string',
			default: '',
			placeholder: 'e.g. 4711, 4712',
			description: 'Comma-separated codes that identify the article',
		},
		SCANNING_RULES_FIELD,
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			default: 'ACTIVE',
			options: LISTING_STATUS_OPTIONS,
		},
		{
			displayName: 'Stock Available Until Calculation Base',
			name: 'stockAvailableUntilBase',
			type: 'options',
			default: '',
			description: 'Base used to calculate the "available until" date',
			options: [
				{ name: '— Not Set —', value: '' },
				{ name: 'Creation', value: 'CREATION' },
				{ name: 'Expiry', value: 'EXPIRY' },
			],
		},
		{
			displayName: 'Stock Available Until Modifier',
			name: 'stockAvailableUntilModifier',
			type: 'string',
			default: '',
			placeholder: 'e.g. -P30D',
			description:
				'ISO-8601 duration shifting the calculated date. -P30D is 30 days before the calculated date.',
		},
		STOCK_PROPERTIES_FIELD,
		TAGS_FIELD,
		localizedField('titleLocalized', 'Title Localized', 'Translations of the title, keyed by locale'),
		{
			displayName: 'Additional Fields (JSON)',
			name: 'additionalFields',
			type: 'json',
			default: '{}',
			description:
				'Advanced: raw JSON merged into the listing for any field not listed above. See ListingForCreation in the API reference.',
		},
	];
}

/** Operations available for the Listing resource (Listings (Core) endpoints). */
export const listingOperations: INodeProperties[] = [
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
				name: 'Create and Update',
				value: 'bulkUpsert',
				description: 'Bulk create or update listings independently of their facility',
				action: 'Create and update listings',
			},
			{
				name: 'Create and Update per Facility',
				value: 'upsertPerFacility',
				description: 'Create or replace the listings of one facility',
				action: 'Create and update listings per facility',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a single listing of a facility',
				action: 'Delete a listing',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single listing of a facility',
				action: 'Get a listing',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many listings of a facility',
				action: 'Get many listings',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Find listings matching a set of conditions',
				action: 'Search listings',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update a single listing of a facility',
				action: 'Update a listing',
			},
		],
		default: 'search',
	},
];

/** Fields for the Listing resource. */
export const listingFields: INodeProperties[] = [
	// ----------------------------------
	//   facility identifier (all facility-scoped operations)
	// ----------------------------------
	{
		displayName: 'Facility',
		name: 'facilityId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: [...SINGLE_LISTING_OPERATIONS, 'getAll', 'upsertPerFacility'],
			},
		},
		description: 'The facility the listing(s) belong to',
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

	// ----------------------------------
	//   tenant article identifier (get / update / delete)
	// ----------------------------------
	{
		displayName: 'Tenant Article ID',
		name: 'tenantArticleId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 4711',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: SINGLE_LISTING_OPERATIONS,
			},
		},
		description: 'The tenant article ID that identifies the listing within the facility',
	},

	// ----------------------------------
	//   listing: get — locale
	// ----------------------------------
	{
		displayName: 'Locale',
		name: 'locale',
		type: 'string',
		default: '',
		placeholder: 'e.g. en_US',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get'],
			},
		},
		description: 'Optional locale used to resolve localized fields of the listing',
	},

	// ----------------------------------
	//   listing: getAll
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
				displayName: 'Tenant Article IDs',
				name: 'tenantArticleIds',
				type: 'string',
				default: '',
				placeholder: 'e.g. 4711, 4712',
				description: 'Comma-separated tenant article IDs to restrict the result to',
			},
		],
	},

	// ----------------------------------
	//   listing: get / getAll / search — simplify
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
	//   listing: update
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
			'Current version of the listing, required for optimistic locking. Retrieve it first with the Get operation.',
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
		description: 'Fields to change on the listing. Only the fields you set are modified.',
		options: [
			...listingCommonFields({ includeTitle: true, includeRecordable: true }),
			{
				displayName: 'Subtitle',
				name: 'subtitle',
				type: 'string',
				default: '',
				placeholder: 'e.g. 44 2/3',
				description: 'A subtitle describing the article',
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
			'Advanced: extra patch actions appended after the modification above. See ModifyListing in the API reference.',
	},

	// ----------------------------------
	//   listing: upsertPerFacility — listings
	// ----------------------------------
	{
		displayName: 'Listings',
		name: 'listings',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Listing',
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['upsertPerFacility'],
			},
		},
		description: 'The listings to create or replace for the facility. The sent set replaces matching listings.',
		options: [
			{
				name: 'listing',
				displayName: 'Listing',
				values: [
					{
						displayName: 'Tenant Article ID',
						name: 'tenantArticleId',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. 4711',
						description: 'Reference to the article this listing is for',
					},
					{
						displayName: 'Version',
						name: 'version',
						type: 'number',
						default: 0,
						description: 'Current version of an existing listing (optimistic locking). Leave 0 for a new listing.',
					},
					...listingCommonFields({ includeTitle: true, includeRecordable: true }),
				],
			},
		],
	},

	// ----------------------------------
	//   listing: bulkUpsert — listings
	// ----------------------------------
	{
		displayName: 'Listings',
		name: 'listings',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Listing',
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['bulkUpsert'],
			},
		},
		description: 'The listings to create or update. Entries times selectors must not exceed 25.',
		options: [
			{
				name: 'listing',
				displayName: 'Listing',
				// Ordered for UX (identifiers, then targeting, then shared fields) rather
				// than alphabetically.
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{
						displayName: 'Tenant Article ID',
						name: 'tenantArticleId',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. 4711',
						description: 'Reference to the article this listing is for',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. Adidas Superstar',
						description: 'A title describing the article',
					},
					{
						displayName: 'Targeting Strategy',
						name: 'targetingStrategy',
						type: 'options',
						default: 'SINGLE_FACILITY',
						description: 'How the target facilities for this listing are specified',
						options: [
							{
								name: 'Single Facility',
								value: 'SINGLE_FACILITY',
								description: 'Target one facility via a reference or tenant facility ID',
							},
							{
								name: 'Multi Selector',
								value: 'MULTI_SELECTOR',
								description: 'Target one or more facilities via a JSON array of selectors',
							},
						],
					},
					{
						displayName: 'Facility Ref',
						name: 'facilityRef',
						type: 'string',
						default: '',
						placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
						displayOptions: {
							show: {
								targetingStrategy: ['SINGLE_FACILITY'],
							},
						},
						description: 'Reference of the target facility. Takes precedence over Tenant Facility ID.',
					},
					{
						displayName: 'Tenant Facility ID',
						name: 'tenantFacilityId',
						type: 'string',
						default: '',
						placeholder: 'e.g. K12345',
						displayOptions: {
							show: {
								targetingStrategy: ['SINGLE_FACILITY'],
							},
						},
						description: 'Tenant facility ID of the target facility, used if no Facility Ref is set',
					},
					{
						displayName: 'Version',
						name: 'version',
						type: 'number',
						default: 0,
						displayOptions: {
							show: {
								targetingStrategy: ['SINGLE_FACILITY'],
							},
						},
						description: 'Current version of an existing listing (optimistic locking). Leave 0 for a new listing.',
					},
					{
						displayName: 'Selector (JSON)',
						name: 'selector',
						type: 'json',
						default: '[]',
						displayOptions: {
							show: {
								targetingStrategy: ['MULTI_SELECTOR'],
							},
						},
						description:
							'Array of facility selectors, e.g. [{"facility":{"facilityRef":"..."}}]. See ListingFacilitySelector in the API reference.',
					},
					...listingCommonFields({ includeTitle: false, includeRecordable: false }),
				],
			},
		],
	},
];
