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
			'Advanced: raw JSON merged into the request body for fields not listed above (e.g. configuration, credentials, cutoffTimes, deliveryAreas, validDeliveryTargets, parcelLabelClassifications, tags). See FacilityCarrierConnectionForCreation in the API reference.',
	},
];
