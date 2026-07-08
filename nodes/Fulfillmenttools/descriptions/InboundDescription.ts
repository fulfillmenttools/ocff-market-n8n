import type { INodeProperties } from 'n8n-workflow';

const RESOURCE = ['inbound'];

const showForInboundCreate = {
	show: {
		resource: RESOURCE,
		operation: ['create'],
	},
};

/**
 * Operations available for the Inbound (inbound process) resource.
 */
export const inboundOperations: INodeProperties[] = [
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
				description: 'Create a new inbound process',
				action: 'Create an inbound process',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an inbound process',
				action: 'Delete an inbound process',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single inbound process',
				action: 'Get an inbound process',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Retrieve many inbound processes',
				action: 'Get many inbound processes',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an existing inbound process',
				action: 'Update an inbound process',
			},
		],
		default: 'create',
	},
];

/**
 * Fields for the Inbound resource.
 */
export const inboundFields: INodeProperties[] = [
	// ----------------------------------
	//   get / update / delete — identifier
	// ----------------------------------
	{
		displayName: 'Inbound Process',
		name: 'inboundProcessId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get', 'update', 'delete'],
			},
		},
		description: 'The inbound process to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchInboundProcesses',
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
				hint: 'The fulfillmenttools inbound process ID',
			},
		],
	},

	// ----------------------------------
	//   getAll
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
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
				resource: RESOURCE,
				operation: ['getAll'],
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
				displayName: 'Facility Ref',
				name: 'facilityRef',
				type: 'string',
				default: '',
				description: 'Filter by the facility the inbound process takes place in',
			},
			{
				displayName: 'Scannable Code',
				name: 'scannableCode',
				type: 'string',
				default: '',
				description: 'Filter by a scannable code (e.g. a delivery note barcode)',
			},
			{
				displayName: 'Search Term',
				name: 'searchTerm',
				type: 'string',
				default: '',
				description:
					'Partial match across tenant inbound process ID, scannable codes, article IDs, supplier name and related listings',
			},
			{
				displayName: 'Sort',
				name: 'sort',
				type: 'options',
				default: 'LAST_MODIFIED_DESC',
				options: [
					{ name: 'Last Modified (Ascending)', value: 'LAST_MODIFIED_ASC' },
					{ name: 'Last Modified (Descending)', value: 'LAST_MODIFIED_DESC' },
					{ name: 'Origin Name (Ascending)', value: 'ORIGIN_NAME_ASC' },
					{ name: 'Origin Name (Descending)', value: 'ORIGIN_NAME_DESC' },
					{ name: 'Requested Date (Ascending)', value: 'REQUESTED_DATE_ASC' },
					{ name: 'Requested Date (Descending)', value: 'REQUESTED_DATE_DESC' },
				],
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: [
					{ name: 'Closed', value: 'CLOSED' },
					{ name: 'On Hold', value: 'ON_HOLD' },
					{ name: 'Open', value: 'OPEN' },
					{ name: 'Partial Delivery', value: 'PARTIAL_DELIVERY' },
				],
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
			'Current version of the inbound process, required for optimistic locking. Retrieve it first with the Get operation.',
	},

	// ----------------------------------
	//   create
	// ----------------------------------
	{
		displayName: 'Facility',
		name: 'facilityRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: showForInboundCreate,
		description: 'The facility in which the inbound process takes place',
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
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: showForInboundCreate,
		options: [
			{
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the inbound process',
			},
			{
				displayName: 'On Hold',
				name: 'onHold',
				type: 'boolean',
				default: false,
				description: 'Whether the inbound process is on hold and will not be processed further',
			},
			{
				displayName: 'Scannable Codes',
				name: 'scannableCodes',
				type: 'string',
				default: '',
				placeholder: 'e.g. 1234567890, 0987654321',
				description: 'Comma-separated scannable codes relevant to the inbound process',
			},
			{
				displayName: 'Tenant Inbound Process ID',
				name: 'tenantInboundProcessId',
				type: 'string',
				default: '',
				placeholder: 'e.g. INB-2026-001',
				description: "The inbound process's ID in your own system",
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
				displayName: 'Custom Attributes (JSON)',
				name: 'customAttributes',
				type: 'json',
				default: '{}',
				description: 'Free-form attributes stored on the inbound process',
			},
			{
				displayName: 'On Hold',
				name: 'onHold',
				type: 'boolean',
				default: false,
				description: 'Whether the inbound process is on hold and will not be processed further',
			},
			{
				displayName: 'Scannable Codes',
				name: 'scannableCodes',
				type: 'string',
				default: '',
				placeholder: 'e.g. 1234567890, 0987654321',
				description: 'Comma-separated scannable codes relevant to the inbound process',
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
			'Advanced: raw JSON merged into the request body for fields not listed above (e.g. purchaseOrder, receipts). See InboundProcessForCreation / InboundProcessForPatch in the API reference.',
	},
];
