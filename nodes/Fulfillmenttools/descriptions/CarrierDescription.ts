import type { INodeProperties } from 'n8n-workflow';

const showForCarrier = {
	show: {
		resource: ['carrier'],
	},
};

const showForCarrierCreate = {
	show: {
		resource: ['carrier'],
		operation: ['create'],
	},
};

/**
 * Operations available for the Carrier resource.
 */
export const carrierOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: showForCarrier,
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new carrier',
				action: 'Create a carrier',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single carrier',
				action: 'Get a carrier',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many carriers',
				action: 'Get many carriers',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing carrier',
				action: 'Update a carrier',
			},
		],
		default: 'create',
	},
];

const statusOptions = [
	{ name: 'Active', value: 'ACTIVE' },
	{ name: 'Inactive', value: 'INACTIVE' },
];

const parcelDimensionOptions: INodeProperties[] = [
	{
		displayName: 'Default Parcel Height',
		name: 'defaultParcelHeightInCm',
		type: 'number',
		default: 10,
		typeOptions: { minValue: 1 },
		description: 'Default parcel height in centimeters',
	},
	{
		displayName: 'Default Parcel Length',
		name: 'defaultParcelLengthInCm',
		type: 'number',
		default: 25,
		typeOptions: { minValue: 1 },
		description: 'Default parcel length in centimeters',
	},
	{
		displayName: 'Default Parcel Weight',
		name: 'defaultParcelWeightInGram',
		type: 'number',
		default: 1000,
		typeOptions: { minValue: 1 },
		description: 'Default parcel weight in grams',
	},
	{
		displayName: 'Default Parcel Width',
		name: 'defaultParcelWidthInCm',
		type: 'number',
		default: 35,
		typeOptions: { minValue: 1 },
		description: 'Default parcel width in centimeters',
	},
];

/**
 * Fields for the Carrier resource.
 */
export const carrierFields: INodeProperties[] = [
	// ----------------------------------
	//   carrier: get / update — identifier
	// ----------------------------------
	{
		displayName: 'Carrier',
		name: 'carrierId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: ['carrier'],
				operation: ['get', 'update'],
			},
		},
		description: 'The carrier to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchCarriers',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
				hint: 'The fulfillmenttools carrier ID',
			},
		],
	},

	// ----------------------------------
	//   carrier: getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['carrier'],
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
				resource: ['carrier'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},

	// ----------------------------------
	//   carrier: get / getAll — simplify
	// ----------------------------------
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['carrier'],
				operation: ['get', 'getAll'],
			},
		},
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},

	// ----------------------------------
	//   carrier: update — version
	// ----------------------------------
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		required: true,
		default: 1,
		displayOptions: {
			show: {
				resource: ['carrier'],
				operation: ['update'],
			},
		},
		description:
			'Current version of the carrier, required for optimistic locking. Retrieve it first with the Get operation.',
	},

	// ----------------------------------
	//   carrier: create
	// ----------------------------------
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. DHL_V2',
		displayOptions: showForCarrierCreate,
		description:
			'References the carrier (CEP) integration. Allowed values include DHL_V2, DPD_CH, DPD_CH_VCE, ANGEL, GLS, FEDEX, POSTNL, BRING, UPS, POST_NORD, DHL_EXPRESS and CUSTOM (use CUSTOM_&lt;name&gt; for multiple custom carriers).',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. DHL Cologne',
		displayOptions: showForCarrierCreate,
		description: 'Human readable name for the carrier',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForCarrierCreate,
		options: [
			...parcelDimensionOptions,
			{
				displayName: 'Logo URL',
				name: 'logoUrl',
				type: 'string',
				default: '',
				placeholder: 'e.g. https://example.com/logo.png',
				description: 'URL of the carrier logo',
			},
			{
				displayName: 'Product Value Needed',
				name: 'productValueNeeded',
				type: 'boolean',
				default: false,
				description:
					'Whether the client is asked for the parcel product value when ordering a label (required for cross-border customs declarations)',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'INACTIVE',
				options: statusOptions,
			},
		],
	},

	// ----------------------------------
	//   carrier: update — fields
	// ----------------------------------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['carrier'],
				operation: ['update'],
			},
		},
		options: [
			...parcelDimensionOptions,
			{
				displayName: 'Delivery Type',
				name: 'deliveryType',
				type: 'options',
				default: 'DELIVERY',
				options: [
					{ name: 'Delivery', value: 'DELIVERY' },
					{ name: 'Same Day', value: 'SAMEDAY' },
				],
			},
			{
				displayName: 'Lifecycle',
				name: 'lifecycle',
				type: 'options',
				default: 'GA',
				options: [
					{ name: 'Alpha', value: 'ALPHA' },
					{ name: 'Beta', value: 'BETA' },
					{ name: 'GA', value: 'GA' },
				],
			},
			{
				displayName: 'Logo URL',
				name: 'logoUrl',
				type: 'string',
				default: '',
				placeholder: 'e.g. https://example.com/logo.png',
				description: 'URL of the carrier logo',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'e.g. DHL Cologne',
				description: 'Human readable name for the carrier',
			},
			{
				displayName: 'Product Value Needed',
				name: 'productValueNeeded',
				type: 'boolean',
				default: false,
				description:
					'Whether the client is asked for the parcel product value when ordering a label (required for cross-border customs declarations)',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'ACTIVE',
				options: statusOptions,
			},
		],
	},

	// ----------------------------------
	//   carrier: create / update — escape hatch
	// ----------------------------------
	{
		displayName: 'Additional Body Fields (JSON)',
		name: 'additionalBodyFields',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['carrier'],
				operation: ['create', 'update'],
			},
		},
		description:
			'Advanced: raw JSON merged into the request body for fields not listed above (e.g. credentials, parcelLabelClassifications). See CarrierForCreation / ModifyCarrier in the API reference.',
	},
];
