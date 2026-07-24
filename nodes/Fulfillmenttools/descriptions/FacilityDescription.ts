import type { INodeProperties } from 'n8n-workflow';

// Managed-facility create only
const showForCreate = {
	show: {
		resource: ['facility'],
		operation: ['create'],
	},
};

// Supplier create only
const showForSupplier = {
	show: {
		resource: ['facility'],
		operation: ['createSupplier'],
	},
};

// Fields shared by both create operations (managed facility + supplier)
const showForCreateAny = {
	show: {
		resource: ['facility'],
		operation: ['create', 'createSupplier'],
	},
};

// Managed-facility structured fields reused by create and update
const showForCreateOrUpdate = {
	show: {
		resource: ['facility'],
		operation: ['create', 'update'],
	},
};

// Fields shared by both create operations and reused by update
const showForCreateAnyOrUpdate = {
	show: {
		resource: ['facility'],
		operation: ['create', 'createSupplier', 'update'],
	},
};

/**
 * Operations available for the Facility resource.
 * Extend the `options` array (and add a matching branch in the node's
 * `execute` router) to support more operations such as get / update / delete.
 */
export const facilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['facility'],
			},
		},
		options: [
			{
				name: 'Create Managed Facility',
				value: 'create',
				description: 'Create a new managed facility',
				action: 'Create a managed facility',
			},
			{
				name: 'Create Supplier Facility',
				value: 'createSupplier',
				description: 'Create a new supplier facility',
				action: 'Create a supplier facility',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a facility',
				action: 'Delete a facility',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single facility',
				action: 'Get a facility',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many facilities',
				action: 'Get many facilities',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Find facilities matching a set of conditions',
				action: 'Search facilities',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing facility',
				action: 'Update a facility',
			},
		],
		default: 'create',
	},
];

/**
 * Fields for the Facility resource. This covers the full
 * `ManagedFacilityForCreation` schema of the fulfillmenttools API.
 */
export const facilityFields: INodeProperties[] = [
	// ----------------------------------
	//   facility: get / update / delete — identifier
	// ----------------------------------
	{
		displayName: 'Facility',
		name: 'facilityId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: ['facility'],
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The facility to operate on',
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
	//   facility: getAll / search — pagination
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['facility'],
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
				resource: ['facility'],
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
				resource: ['facility'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				default: 'NAME',
				options: [
					{ name: 'Created', value: 'CREATED' },
					{ name: 'Name', value: 'NAME' },
					{ name: 'Postal Code (Ascending)', value: 'POSTAL_CODE_ASC' },
				],
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Offline', value: 'OFFLINE' },
					{ name: 'Online', value: 'ONLINE' },
					{ name: 'Suspended', value: 'SUSPENDED' },
				],
			},
			{
				displayName: 'Tenant Facility ID',
				name: 'tenantFacilityId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Managed Facility', value: 'MANAGED_FACILITY' },
					{ name: 'Supplier', value: 'SUPPLIER' },
				],
			},
		],
	},

	// ----------------------------------
	//   facility: get / getAll / search — simplify
	// ----------------------------------
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['facility'],
				operation: ['get', 'getAll', 'search'],
			},
		},
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},

	// ----------------------------------
	//   facility: delete
	// ----------------------------------
	{
		displayName: 'Force Deletion',
		name: 'forceDeletion',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['facility'],
				operation: ['delete'],
			},
		},
		description: 'Whether to cascade the deletion without pre-condition checks',
	},

	// ----------------------------------
	//   facility: update
	// ----------------------------------
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		required: true,
		default: 1,
		displayOptions: {
			show: {
				resource: ['facility'],
				operation: ['update'],
			},
		},
		description:
			'Current version of the facility, required for optimistic locking. Retrieve it first with the Get operation.',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['facility'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Capacity Enabled',
				name: 'capacityEnabled',
				type: 'boolean',
				default: false,
				description: 'Whether configured capacity limits for picking times are considered',
			},
			{
				displayName: 'Capacity Planning Timeframe (Days)',
				name: 'capacityPlanningTimeframe',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'How many days into the future the capacity of the facility can be planned',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the facility',
			},
			{
				displayName: 'Fulfillment Process Buffer (Minutes)',
				name: 'fulfillmentProcessBuffer',
				type: 'number',
				default: 240,
				typeOptions: { minValue: 0 },
				description: 'Duration in minutes until an order is processed',
			},
			{
				displayName: 'Location Type',
				name: 'locationType',
				type: 'options',
				default: 'STORE',
				options: [
					{ name: 'External', value: 'EXTERNAL' },
					{ name: 'Store', value: 'STORE' },
					{ name: 'Warehouse', value: 'WAREHOUSE' },
				],
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'ONLINE',
				options: [
					{ name: 'Offline', value: 'OFFLINE' },
					{ name: 'Online', value: 'ONLINE' },
					{ name: 'Suspended', value: 'SUSPENDED' },
				],
			},
			{
				displayName: 'Tenant Facility ID',
				name: 'tenantFacilityId',
				type: 'string',
				default: '',
				placeholder: 'e.g. K12345',
			},
		],
	},
	{
		displayName: 'Address',
		name: 'address',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['facility'],
				operation: ['update'],
			},
		},
		description: 'Facility address fields to update. Only the fields you set are changed.',
		options: [
			{
				displayName: 'Additional Address Info',
				name: 'additionalAddressInfo',
				type: 'string',
				default: '',
				placeholder: 'e.g. c/o Jane Doe',
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
				description: 'Company name of the facility address',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				placeholder: 'e.g. DE',
				description: 'Two-letter country code as per ISO 3166-1 alpha-2 (e.g. DE)',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the address',
			},
			{
				displayName: 'House Number',
				name: 'houseNumber',
				type: 'string',
				default: '',
				placeholder: 'e.g. 42a',
			},
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description:
					'Latitude of the facility. If set, Longitude is required too; otherwise the address is geocoded automatically.',
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description:
					'Longitude of the facility. If set, Latitude is required too; otherwise the address is geocoded automatically.',
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
				displayName: 'Street',
				name: 'street',
				type: 'string',
				default: '',
				placeholder: 'e.g. Hauptstr.',
			},
			{
				displayName: 'Time Zone ID',
				name: 'timeZoneId',
				type: 'string',
				default: '',
				placeholder: 'e.g. Europe/Berlin',
				description:
					'IANA time zone identifier. If unset, the time zone is resolved from the address automatically.',
			},
		],
	},
	{
		displayName: 'Additional Body Fields (JSON)',
		name: 'additionalBodyFields',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: {
				resource: ['facility'],
				operation: ['update'],
			},
		},
		description:
			'Advanced: raw JSON merged into the modification body for fields not listed above (e.g. configs). See ManagedFacilityForModification in the API reference.',
	},

	// ----------------------------------
	//   facility: create — required
	// ----------------------------------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Hamburg NW2',
		displayOptions: showForCreateAny,
		description: 'Human readable name of the facility',
	},
	{
		displayName: 'Company Name',
		name: 'companyName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Speedy Boxales Ltd.',
		displayOptions: showForCreateAny,
		description: 'Company name of the facility address',
	},
	{
		displayName: 'Street',
		name: 'street',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Hauptstr.',
		displayOptions: showForCreate,
	},
	{
		displayName: 'House Number',
		name: 'houseNumber',
		type: 'string',
		default: '',
		placeholder: 'e.g. 42a',
		displayOptions: showForCreate,
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Langenfeld',
		displayOptions: showForCreate,
	},
	{
		displayName: 'Postal Code',
		name: 'postalCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 40764',
		displayOptions: showForCreate,
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. DE',
		displayOptions: showForCreateAny,
		description: 'Two-letter country code as per ISO 3166-1 alpha-2 (e.g. DE)',
	},

	// ----------------------------------
	//   facility: createSupplier — address
	// ----------------------------------
	{
		displayName: 'Address Fields',
		name: 'supplierAddress',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForSupplier,
		description: 'Optional address details for the supplier',
		options: [
			{
				displayName: 'Additional Address Info',
				name: 'additionalAddressInfo',
				type: 'string',
				default: '',
				placeholder: 'e.g. c/o Jane Doe',
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				placeholder: 'e.g. Langenfeld',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the address',
			},
			{
				displayName: 'House Number',
				name: 'houseNumber',
				type: 'string',
				default: '',
				placeholder: 'e.g. 42a',
			},
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description: 'If set, Longitude is required too; otherwise the address is geocoded',
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description: 'If set, Latitude is required too; otherwise the address is geocoded',
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
				displayName: 'Street',
				name: 'street',
				type: 'string',
				default: '',
				placeholder: 'e.g. Hauptstr.',
			},
			{
				displayName: 'Time Zone ID',
				name: 'timeZoneId',
				type: 'string',
				default: '',
				placeholder: 'e.g. Europe/Berlin',
				description: 'IANA time zone identifier. If unset, resolved from the address automatically.',
			},
		],
	},

	// ----------------------------------
	//   facility: create — fulfillment behaviour
	// ----------------------------------
	{
		displayName: 'Picking Methods',
		name: 'pickingMethods',
		type: 'multiOptions',
		default: [],
		displayOptions: showForCreateOrUpdate,
		description: 'Picking methods supported by this facility',
		options: [
			{ name: 'Batch', value: 'BATCH' },
			{ name: 'Multi Order', value: 'MULTI_ORDER' },
			{ name: 'Single Order', value: 'SINGLE_ORDER' },
		],
	},
	{
		displayName: 'Services',
		name: 'services',
		type: 'multiOptions',
		default: [],
		displayOptions: showForCreateOrUpdate,
		description: 'Services this facility offers',
		options: [
			{ name: 'Pickup', value: 'PICKUP' },
			{ name: 'Ship From Store', value: 'SHIP_FROM_STORE' },
		],
	},

	// ----------------------------------
	//   facility: create — address extras
	// ----------------------------------
	{
		displayName: 'Additional Address Fields',
		name: 'addressAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForCreate,
		options: [
			{
				displayName: 'Additional Address Info',
				name: 'additionalAddressInfo',
				type: 'string',
				default: '',
				placeholder: 'e.g. c/o Jane Doe',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the address',
			},
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description:
					'Latitude of the facility. If set, Longitude is required too; otherwise the address is geocoded automatically.',
			},
			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				default: 0,
				typeOptions: { numberPrecision: 6 },
				description:
					'Longitude of the facility. If set, Latitude is required too; otherwise the address is geocoded automatically.',
			},
			{
				displayName: 'Province',
				name: 'province',
				type: 'string',
				default: '',
				placeholder: 'e.g. NRW',
			},
			{
				displayName: 'Time Zone ID',
				name: 'timeZoneId',
				type: 'string',
				default: '',
				placeholder: 'e.g. Europe/Berlin',
				description:
					'IANA time zone identifier. If unset, the time zone is resolved from the address automatically.',
			},
		],
	},
	{
		displayName: 'Phone Numbers',
		name: 'phoneNumbers',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Phone Number',
		default: {},
		displayOptions: showForCreateAnyOrUpdate,
		options: [
			{
				name: 'number',
				displayName: 'Phone Number',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. +49 151 12345678',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						required: true,
						default: 'PHONE',
						options: [
							{ name: 'Mobile', value: 'MOBILE' },
							{ name: 'Phone', value: 'PHONE' },
						],
					},
					{
						displayName: 'Label',
						name: 'label',
						type: 'string',
						default: '',
						placeholder: 'e.g. business',
					},
				],
			},
		],
	},
	{
		displayName: 'Email Addresses',
		name: 'emailAddresses',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Email Address',
		default: {},
		displayOptions: showForCreateAnyOrUpdate,
		options: [
			{
				name: 'email',
				displayName: 'Email Address',
				values: [
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. store@example.com',
					},
					{
						displayName: 'Recipient',
						name: 'recipient',
						type: 'string',
						default: '',
						description: 'Human readable info about who receives emails at this address',
					},
				],
			},
		],
	},

	// ----------------------------------
	//   facility: create — contact
	// ----------------------------------
	{
		displayName: 'Contact',
		name: 'contact',
		type: 'collection',
		placeholder: 'Add Contact Field',
		default: {},
		displayOptions: showForCreateOrUpdate,
		description: 'Contact person for the facility. First and last name are both required if set.',
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the contact',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Role Description',
				name: 'roleDescription',
				type: 'string',
				default: '',
				placeholder: 'e.g. Manager',
			},
		],
	},

	// ----------------------------------
	//   facility: create — fulfillment behaviour
	// ----------------------------------
	{
		displayName: 'Picking Times',
		name: 'pickingTimes',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Picking Time',
		default: {},
		displayOptions: showForCreateOrUpdate,
		description: 'Time ranges per weekday during which picking happens. Ranges must not overlap.',
		options: [
			{
				name: 'range',
				displayName: 'Time Range',
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{
						displayName: 'Weekday',
						name: 'weekday',
						type: 'options',
						default: 'monday',
						// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
						options: [
							{ name: 'Monday', value: 'monday' },
							{ name: 'Tuesday', value: 'tuesday' },
							{ name: 'Wednesday', value: 'wednesday' },
							{ name: 'Thursday', value: 'thursday' },
							{ name: 'Friday', value: 'friday' },
							{ name: 'Saturday', value: 'saturday' },
							{ name: 'Sunday', value: 'sunday' },
						],
					},
					{
						displayName: 'Start Hour',
						name: 'startHour',
						type: 'number',
						required: true,
						default: 8,
						typeOptions: { minValue: 0, maxValue: 23 },
					},
					{
						displayName: 'Start Minute',
						name: 'startMinute',
						type: 'number',
						required: true,
						default: 0,
						typeOptions: { minValue: 0, maxValue: 59 },
					},
					{
						displayName: 'End Hour',
						name: 'endHour',
						type: 'number',
						required: true,
						default: 18,
						typeOptions: { minValue: 0, maxValue: 23 },
					},
					{
						displayName: 'End Minute',
						name: 'endMinute',
						type: 'number',
						required: true,
						default: 0,
						typeOptions: { minValue: 0, maxValue: 59 },
					},
					{
						displayName: 'Capacity',
						name: 'capacity',
						type: 'number',
						default: 0,
						typeOptions: { minValue: 0 },
						description: 'Optional picking capacity for this range. Leave 0 to omit.',
					},
				],
			},
		],
	},
	{
		displayName: 'Scanning Rules',
		name: 'scanningRules',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Scanning Rule',
		default: {},
		displayOptions: showForCreateOrUpdate,
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
	},
	{
		displayName: 'Closing Days',
		name: 'closingDays',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Closing Day',
		default: {},
		displayOptions: showForCreateOrUpdate,
		description: 'Days on which the facility is closed and does not pick',
		options: [
			{
				name: 'day',
				displayName: 'Closing Day',
				values: [
					{
						displayName: 'Date',
						name: 'date',
						type: 'dateTime',
						default: '',
						required: true,
					},
					{
						displayName: 'Reason',
						name: 'reason',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. Public holiday',
					},
					{
						displayName: 'Recurrence',
						name: 'recurrence',
						type: 'options',
						required: true,
						default: 'NONRECURRING',
						options: [
							{ name: 'Nonrecurring', value: 'NONRECURRING' },
							{ name: 'Yearly', value: 'YEARLY' },
						],
					},
				],
			},
		],
	},

	// ----------------------------------
	//   facility: create — tags
	// ----------------------------------
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Tag',
		default: {},
		displayOptions: showForCreateAnyOrUpdate,
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
	},

	// ----------------------------------
	//   facility: create — operative cost
	// ----------------------------------
	{
		displayName: 'Operative Cost',
		name: 'operativeCost',
		type: 'collection',
		placeholder: 'Add Cost Field',
		default: {},
		displayOptions: showForCreateAny,
		description: 'Operational cost of the facility. Value and currency are both required if set.',
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'EUR',
				placeholder: 'e.g. EUR',
				description: 'Currency as an ISO 4217 code',
			},
			{
				displayName: 'Decimal Places',
				name: 'decimalPlaces',
				type: 'number',
				default: 2,
				typeOptions: { minValue: 0 },
				description: 'Number of decimal places for the currency',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Value in the smallest subunit, e.g. cents',
			},
		],
	},

	// ----------------------------------
	//   facility: create — other options
	// ----------------------------------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForCreate,
		options: [
			{
				displayName: 'Capacity Enabled',
				name: 'capacityEnabled',
				type: 'boolean',
				default: false,
				description: 'Whether configured capacity limits for picking times are considered',
			},
			{
				displayName: 'Capacity Planning Timeframe (Days)',
				name: 'capacityPlanningTimeframe',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'How many days into the future the capacity of the facility can be planned',
			},
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the facility',
			},
			{
				displayName: 'Fulfillment Process Buffer (Minutes)',
				name: 'fulfillmentProcessBuffer',
				type: 'number',
				default: 240,
				typeOptions: { minValue: 0 },
				description: 'Duration in minutes until an order is processed',
			},
			{
				displayName: 'Location Type',
				name: 'locationType',
				type: 'options',
				default: 'STORE',
				options: [
					{ name: 'External', value: 'EXTERNAL' },
					{ name: 'Store', value: 'STORE' },
					{ name: 'Warehouse', value: 'WAREHOUSE' },
				],
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'ONLINE',
				options: [
					{
						name: 'Offline',
						value: 'OFFLINE',
						description: 'Cannot fulfill any new or existing orders',
					},
					{
						name: 'Online',
						value: 'ONLINE',
						description: 'Can process new orders and pickjobs',
					},
					{
						name: 'Suspended',
						value: 'SUSPENDED',
						description: 'Cannot get new orders but can fulfill current workload',
					},
				],
			},
			{
				displayName: 'Tenant Facility ID',
				name: 'tenantFacilityId',
				type: 'string',
				default: '',
				placeholder: 'e.g. K12345',
				description: "The ID of the facility in the tenant's own system",
			},
		],
	},

	// ----------------------------------
	//   facility: createSupplier — other options
	// ----------------------------------
	{
		displayName: 'Additional Fields',
		name: 'supplierAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForSupplier,
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the facility',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'ONLINE',
				options: [
					{
						name: 'Offline',
						value: 'OFFLINE',
						description: 'Cannot fulfill any new or existing orders',
					},
					{
						name: 'Online',
						value: 'ONLINE',
						description: 'Can process new orders and pickjobs',
					},
					{
						name: 'Suspended',
						value: 'SUSPENDED',
						description: 'Cannot get new orders but can fulfill current workload',
					},
				],
			},
			{
				displayName: 'Tenant Facility ID',
				name: 'tenantFacilityId',
				type: 'string',
				default: '',
				placeholder: 'e.g. K12345',
				description: "The ID of the facility in the tenant's own system",
			},
		],
	},
];
