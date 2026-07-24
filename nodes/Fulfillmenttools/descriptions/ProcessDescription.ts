import type { INodeProperties } from 'n8n-workflow';

const RESOURCE = ['process'];

/**
 * Operations that address a single process by ID. `downloadDocumentFile` is
 * included because it needs a process too — unless it is looking the file up by
 * document ID alone, which the `downloadScope` hide below takes care of.
 *
 * Every parameter name must be declared exactly once across the node: n8n keys
 * node parameters by name, so a second declaration of the same name can hide or
 * strip the value of the first one.
 */
const PROCESS_ID_OPERATIONS = [
	'get',
	'getHistoryLogs',
	'createDocument',
	'getDocument',
	'updateDocumentFile',
	'downloadDocumentFile',
];

/** Operations that address a single document. */
const DOCUMENT_ID_OPERATIONS = ['getDocument', 'updateDocumentFile', 'downloadDocumentFile'];

/** Operations that upload a file. */
const FILE_UPLOAD_OPERATIONS = ['createDocument', 'updateDocumentFile'];

/**
 * Operations available for the Process resource, covering the Processes (Core)
 * endpoints: the process itself, its documents and their files, and its history
 * logs.
 */
export const processOperations: INodeProperties[] = [
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
				name: 'Create Document',
				value: 'createDocument',
				description: 'Attach a document to a process',
				action: 'Create a process document',
			},
			{
				name: 'Download Document File',
				value: 'downloadDocumentFile',
				description: 'Download the file of a document as binary data',
				action: 'Download a process document file',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single process by ID',
				action: 'Get a process',
			},
			{
				name: 'Get by Reference',
				value: 'getByReference',
				description: 'Retrieve a process by a referenced order, pick job, shipment or return',
				action: 'Get a process by reference',
			},
			{
				name: 'Get Document',
				value: 'getDocument',
				description: 'Retrieve the metadata of a document attached to a process',
				action: 'Get a process document',
			},
			{
				name: 'Get History Logs',
				value: 'getHistoryLogs',
				description: 'Retrieve the history log entries of a process',
				action: 'Get history logs of a process',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Find processes matching a set of conditions',
				action: 'Search processes',
			},
			{
				name: 'Update Document File',
				value: 'updateDocumentFile',
				description: 'Replace the file of a document attached to a process',
				action: 'Update a process document file',
			},
		],
		default: 'search',
	},
];

/** Fields for the Process resource. */
export const processFields: INodeProperties[] = [
	// ----------------------------------
	//   process identifier
	// ----------------------------------
	{
		displayName: 'Process',
		name: 'processId',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: PROCESS_ID_OPERATIONS,
			},
			// Downloading straight by document ID doesn't involve a process.
			hide: {
				downloadScope: ['document'],
			},
		},
		description: 'The process to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchProcesses',
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
	},

	// ----------------------------------
	//   process: getByReference
	// ----------------------------------
	{
		displayName: 'Reference Type',
		name: 'referenceType',
		type: 'options',
		default: 'tenantOrderId',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getByReference'],
			},
		},
		description: 'Which reference to look the process up by',
		options: [
			{ name: 'Handover Job Ref', value: 'handoverJobRef' },
			{ name: 'Order Ref', value: 'orderRef' },
			{ name: 'Pick Job Ref', value: 'pickJobRef' },
			{ name: 'Return Ref', value: 'returnRef' },
			{ name: 'Shipment Ref', value: 'shipmentRef' },
			{ name: 'Tenant Order ID', value: 'tenantOrderId' },
		],
	},
	{
		displayName: 'Reference Value',
		name: 'referenceValue',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getByReference'],
			},
		},
		description: 'Value of the selected reference',
	},

	// ----------------------------------
	//   process: downloadDocumentFile — scope
	// ----------------------------------
	{
		displayName: 'Look Up By',
		name: 'downloadScope',
		type: 'options',
		default: 'process',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['downloadDocumentFile'],
			},
		},
		description:
			'Whether to download the file through its process or directly by document ID. The two endpoints need different permissions.',
		options: [
			{
				name: 'Process and Document',
				value: 'process',
				description: 'Uses GET /api/processes/{processId}/documents/{documentId}/file',
			},
			{
				name: 'Document Only',
				value: 'document',
				description: 'Uses GET /api/documents/{documentId}/file',
			},
		],
	},
	// ----------------------------------
	//   document identifier
	// ----------------------------------
	// Declared once for every operation that takes a document, so that n8n never
	// sees the same parameter name twice.
	{
		displayName: 'Document ID',
		name: 'documentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: DOCUMENT_ID_OPERATIONS,
			},
		},
		description: "The document to operate on. Process responses list these under 'documentRefs'.",
	},

	// ----------------------------------
	//   process: downloadDocumentFile — output
	// ----------------------------------
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
				operation: ['downloadDocumentFile'],
			},
		},
		hint: 'The name of the output binary field to put the downloaded file in',
	},

	// ----------------------------------
	//   process: createDocument
	// ----------------------------------
	{
		displayName: 'Document Type',
		name: 'documentType',
		type: 'options',
		required: true,
		default: 'PDF',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['createDocument'],
			},
		},
		description: 'Format of the document',
		options: [
			{ name: 'GIF', value: 'GIF' },
			{ name: 'JPEG', value: 'JPEG' },
			{ name: 'JPG', value: 'JPG' },
			{ name: 'JSON', value: 'JSON' },
			{ name: 'PDF', value: 'PDF' },
			{ name: 'PNG', value: 'PNG' },
			{ name: 'XML', value: 'XML' },
			{ name: 'ZPL', value: 'ZPL' },
		],
	},
	{
		displayName: 'Section',
		name: 'section',
		type: 'options',
		required: true,
		default: 'ORDER',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['createDocument'],
			},
		},
		description: 'Which part of the process the document belongs to',
		options: [
			{ name: 'Handover Job', value: 'HANDOVERJOB' },
			{ name: 'Order', value: 'ORDER' },
			{ name: 'Pack Job', value: 'PACKJOB' },
			{ name: 'Packing Target Container', value: 'PACKING_TARGET_CONTAINER' },
			{ name: 'Parcel', value: 'PARCEL' },
			{ name: 'Pick Job', value: 'PICKJOB' },
		],
	},

	// ----------------------------------
	//   process: updateDocumentFile — optimistic locking
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
				operation: ['updateDocumentFile'],
			},
		},
		description:
			'Current version of the document, required for optimistic locking. Retrieve it first with the Get Document operation.',
	},

	// ----------------------------------
	//   file upload (create + update)
	// ----------------------------------
	{
		displayName: 'Attach File',
		name: 'attachFile',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['createDocument'],
			},
		},
		description:
			'Whether to upload a file with the document. Turn off to register the document and add its file later.',
	},
	{
		displayName: 'File Source',
		name: 'fileSource',
		type: 'options',
		default: 'binary',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: FILE_UPLOAD_OPERATIONS,
			},
			hide: {
				attachFile: [false],
			},
		},
		description: 'Where the document file comes from',
		options: [
			{
				name: 'Binary Field',
				value: 'binary',
				description: 'Take the file from a binary field of the input item',
			},
			{
				name: 'Base64 String',
				value: 'base64',
				description: 'Provide the file contents base64 encoded',
			},
		],
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: FILE_UPLOAD_OPERATIONS,
				fileSource: ['binary'],
			},
			hide: {
				attachFile: [false],
			},
		},
		hint: 'The name of the input binary field containing the file to upload',
	},
	{
		displayName: 'File Content',
		name: 'fileContent',
		type: 'string',
		required: true,
		default: '',
		typeOptions: { rows: 4 },
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: FILE_UPLOAD_OPERATIONS,
				fileSource: ['base64'],
			},
			hide: {
				attachFile: [false],
			},
		},
		description: 'Base64-encoded contents of the file',
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		placeholder: 'e.g. deliveryNote.pdf',
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: FILE_UPLOAD_OPERATIONS,
			},
			hide: {
				attachFile: [false],
			},
		},
		description:
			'File name including its extension. Required for base64 content; for a binary field it defaults to the name of the incoming file.',
	},

	// ----------------------------------
	//   process: createDocument — options
	// ----------------------------------
	{
		displayName: 'Options',
		name: 'documentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['createDocument'],
			},
		},
		options: [
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Ranks the document against others of the same section',
			},
		],
	},

	// ----------------------------------
	//   process: getHistoryLogs
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getHistoryLogs', 'search'],
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
				operation: ['getHistoryLogs', 'search'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'historyLogFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['getHistoryLogs'],
			},
		},
		options: [
			{
				displayName: 'Facility Name',
				name: 'facilityName',
				type: 'string',
				default: '',
				description: 'Only return logs recorded at this facility',
			},
			{
				displayName: 'Filter Consecutive Duplicates',
				name: 'filterConsecutiveDuplicates',
				type: 'boolean',
				default: true,
				description: 'Whether to collapse consecutive duplicate log entries',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				default: 'TIMESTAMP_DESC',
				options: [
					{ name: 'Facility Name (Ascending)', value: 'FACILITY_NAME_ASC' },
					{ name: 'Facility Name (Descending)', value: 'FACILITY_NAME_DESC' },
					{ name: 'Info (Ascending)', value: 'INFO_ASC' },
					{ name: 'Info (Descending)', value: 'INFO_DESC' },
					{ name: 'Timestamp (Ascending)', value: 'TIMESTAMP_ASC' },
					{ name: 'Timestamp (Descending)', value: 'TIMESTAMP_DESC' },
					{ name: 'Type (Ascending)', value: 'TYPE_ASC' },
					{ name: 'Type (Descending)', value: 'TYPE_DESC' },
				],
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'string',
				default: '',
				description: 'Only return logs of this type',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				description: 'Only return logs recorded by this user',
			},
		],
	},

	// ----------------------------------
	//   process: simplify
	// ----------------------------------
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: RESOURCE,
				operation: ['get', 'getByReference', 'search'],
			},
		},
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},
];
