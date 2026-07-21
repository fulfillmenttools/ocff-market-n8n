import type { INodeProperties } from 'n8n-workflow';

const RESOURCE = ['facilityCarrierConnection'];

const statusOptions = [
	{ name: 'Active', value: 'ACTIVE' },
	{ name: 'Inactive', value: 'INACTIVE' },
];

/**
 * Operations available for the Facility Carrier Connection resource.
 * These endpoints are nested under a facility:
 * /api/facilities/{facilityId}/carriers[/{carrierRef}].
 */
export const facilityCarrierConnectionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: RESOURCE } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Connect a carrier to a facility',
				action: 'Create a facility carrier connection',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single facility carrier connection',
				action: 'Get a facility carrier connection',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many carrier connections of a facility',
				action: 'Get many facility carrier connections',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing facility carrier connection',
				action: 'Update a facility carrier connection',
			},
		],
		default: 'create',
	},
];

/**
 * Fields for the Facility Carrier Connection resource.
 */
export const facilityCarrierConnectionFields: INodeProperties[] = [
	// ----------------------------------
	//   facility (required for all operations)
	// ----------------------------------
	{
		displayName: 'Facility',
		name: 'facilityId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: { show: { resource: RESOURCE } },
		description: 'The facility whose carrier connections to operate on',
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
	//   carrier reference (get / create / update)
	// ----------------------------------
	{
		displayName: 'Carrier',
		name: 'carrierRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get', 'create', 'update'],
			},
		},
		description: 'The carrier to connect / operate on',
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
				hint: 'The carrier reference (carrier ID)',
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
			'Current version of the connection, required for optimistic locking. Retrieve it first with the Get operation.',
	},

	// ----------------------------------
	//   create — fields
	// ----------------------------------
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'e.g. DHL Cologne standard',
				description: 'Human readable name for the connection',
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'e.g. DHL Cologne standard',
				description: 'Human readable name for the connection',
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
	//   create / update — structured body fields
	// ----------------------------------
	{
		displayName: 'Valid Delivery Targets',
		name: 'validDeliveryTargets',
		type: 'multiOptions',
		default: [],
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update'],
			},
		},
		description: 'Valid delivery targets for this connection',
		options: [
			{ name: 'Ship to Customer', value: 'SHIP_TO_CUSTOMER' },
			{ name: 'Ship to Store', value: 'SHIP_TO_STORE' },
		],
	},
	{
		displayName: 'Cutoff Time',
		name: 'cutoffTime',
		type: 'fixedCollection',
		typeOptions: { multipleValues: false },
		placeholder: 'Add Cutoff Time',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update'],
			},
		},
		description: 'Cutoff time configuration for this connection',
		options: [
			{
				name: 'value',
				displayName: 'Cutoff Time',
				values: [
					{
						displayName: 'Hour',
						name: 'hour',
						type: 'number',
						required: true,
						default: 12,
						typeOptions: { minValue: 0, maxValue: 23 },
						description: 'Hour of the cutoff time (0-23)',
					},
					{
						displayName: 'Minute',
						name: 'minute',
						type: 'number',
						required: true,
						default: 0,
						typeOptions: { minValue: 0, maxValue: 59 },
						description: 'Minute of the cutoff time (0-59)',
					},
				],
			},
		],
	},
	{
		displayName: 'Delivery Areas',
		name: 'deliveryAreas',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Delivery Area',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update'],
			},
		},
		description: 'Delivery areas supported by this connection',
		options: [
			{
				name: 'area',
				displayName: 'Delivery Area',
				values: [
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. DE',
						description: 'A two-digit country code as per ISO 3166-1 alpha-2',
					},
					{
						displayName: 'Postal Code',
						name: 'postalCode',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. 40764',
						description: 'Postal code within the country',
					},
				],
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
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update'],
			},
		},
		description: 'Tags associated with the connection',
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
						placeholder: 'e.g. color',
						description: 'Identifier of the tag',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. red',
						description: 'Value of the tag',
					},
				],
			},
		],
	},

	{
		displayName: 'Parcel Label Classifications',
		name: 'parcelLabelClassifications',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Classification',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update'],
			},
		},
		description: 'Parcel label size classifications offered by this connection',
		options: [
			{
				displayName: 'Classification',
				name: 'classification',
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						placeholder: 'e.g. S-Parcel',
						description: 'Display name of the classification',
					},
					{
						displayName: 'Locale',
						name: 'locale',
						type: 'string',
						default: 'en_US',
						placeholder: 'e.g. en_US',
						description: 'Locale the name is given in (used as the key of the localized name)',
					},
					{
						displayName: 'Height (Cm)',
						name: 'height',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Parcel height in centimeters',
					},
					{
						displayName: 'Length (Cm)',
						name: 'length',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Parcel length in centimeters',
					},
					{
						displayName: 'Width (Cm)',
						name: 'width',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Parcel width in centimeters',
					},
					{
						displayName: 'Weight (Gram)',
						name: 'weight',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Parcel weight in grams',
					},
					{
						displayName: 'Custom Weight (Gram)',
						name: 'customWeight',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Custom parcel weight in grams',
					},
					{
						displayName: 'Bulky Goods',
						name: 'bulkyGoods',
						type: 'boolean',
						default: false,
						description: 'Whether this classification is for bulky goods',
					},
				],
			},
		],
	},
	{
		displayName: 'Configuration (JSON)',
		name: 'configuration',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update'],
			},
		},
		description: 'Carrier-specific configuration object. The fields depend on the carrier.',
	},
	{
		displayName: 'Credentials (JSON)',
		name: 'credentials',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['create', 'update'],
			},
		},
		description: 'Carrier-specific credentials object. The fields depend on the carrier.',
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
				operation: ['create', 'update'],
			},
		},
		description:
			'Advanced: raw JSON merged into the request body for fields not listed above (e.g. cutoffTimes, the weekday-based cutoff configuration). See FacilityCarrierConnectionForCreation in the API reference.',
	},
];
