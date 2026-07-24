import type { INodeProperties } from 'n8n-workflow';

import {
	PARCEL_STATUS_OPTIONS,
	PRODUCT_VALUE_TYPE_OPTIONS,
	SHIPMENT_STATUS_OPTIONS,
} from '../SearchConfigs';

const RESOURCE = ['shipment'];

const PARCEL_ID_OPS = [
	'getParcel',
	'updateParcel',
	'getParcelDeliveryNote',
	'getParcelLabel',
	'getParcelReturnNote',
	'getParcelTransferLabel',
];
const PARCEL_DOWNLOAD_OPS = [
	'getParcelDeliveryNote',
	'getParcelLabel',
	'getParcelReturnNote',
	'getParcelTransferLabel',
];
const SHIPMENT_ID_OPS = ['getShipment', 'updateShipment', 'getShipmentDeliveryNote', 'createShipmentParcel'];
const PARCEL_CREATE_OPS = ['createParcel', 'createShipmentParcel'];
const PARCEL_STRUCT_OPS = ['createParcel', 'createShipmentParcel', 'updateParcel'];
const SIMPLIFY_OPS = ['getParcel', 'listParcels', 'searchParcels', 'getShipment', 'listShipments', 'searchShipments'];
const PAGINATED_OPS = ['listParcels', 'listShipments', 'searchParcels', 'searchShipments'];

// ---------------------------------------------------------------------------
//  Reusable field-group helpers (each scoped to a set of operations)
// ---------------------------------------------------------------------------

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

/** A Tags collection (`TagReference[]`) with a custom name. */
function tagsField(name: string, description?: string): INodeProperties {
	return {
		displayName: 'Tags',
		name,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Tag',
		default: {},
		...(description ? { description } : {}),
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

/** A Transfers collection (`OperativeTransfer[]`). */
function transfersField(operation: string[]): INodeProperties {
	return {
		displayName: 'Transfers',
		name: 'transfers',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Transfer',
		default: {},
		displayOptions: show(operation),
		options: [
			{
				name: 'transfer',
				displayName: 'Transfer',
				values: [
					{ displayName: 'ID', name: 'id', type: 'string', required: true, default: '', description: 'ID of the transfer' },
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

/** The article + shared fields for a line/parcel item, with optional trailing extras. */
function articleValues(atEnd: INodeProperties[] = []): INodeProperties[] {
	return [
		{ displayName: 'Tenant Article ID', name: 'tenantArticleId', type: 'string', required: true, default: '', placeholder: 'e.g. 4711', description: 'Reference to the article' },
		{ displayName: 'Title', name: 'title', type: 'string', required: true, default: '', placeholder: 'e.g. Cologne Water', description: 'Title of the article' },
		{ displayName: 'Quantity', name: 'quantity', type: 'number', required: true, default: 1, typeOptions: { minValue: 1 }, description: 'Quantity of the article' },
		{ displayName: 'Image URL', name: 'imageUrl', type: 'string', default: '', placeholder: 'e.g. https://example.com/image.png' },
		{ displayName: 'Weight', name: 'weight', type: 'number', default: 0, typeOptions: { minValue: 0 }, description: 'Article weight in grams. 0 to omit.' },
		localizedField('titleLocalized', 'Title Localized', 'Translations of the article title, keyed by locale'),
		ARTICLE_ATTRIBUTES_FIELD,
		{ displayName: 'Article Custom Attributes (JSON)', name: 'articleCustomAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the article' },
		...atEnd,
	];
}

/** A ConsumerAddress collection scoped to given operations. */
function addressField(name: string, displayName: string, operation: string[]): INodeProperties {
	return {
		displayName,
		name,
		type: 'collection',
		placeholder: 'Add Address Field',
		default: {},
		displayOptions: show(operation),
		options: [
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
			{ displayName: 'Email', name: 'email', type: 'string',
																																										placeholder: 'name@email.com', default: '' },
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '' },
			{ displayName: 'House Number', name: 'houseNumber', type: 'string', default: '', placeholder: 'e.g. 42a' },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '' },
			{ displayName: 'Latitude', name: 'latitude', type: 'number', default: 0, typeOptions: { numberPrecision: 6 }, description: 'Both latitude and longitude must be set together' },
			{ displayName: 'Longitude', name: 'longitude', type: 'number', default: 0, typeOptions: { numberPrecision: 6 }, description: 'Both latitude and longitude must be set together' },
			{ displayName: 'Personal Title', name: 'personalTitle', type: 'string', default: '', placeholder: 'e.g. Dr.' },
			{ displayName: 'Phone Numbers (JSON)', name: 'phoneNumbers', type: 'json', default: '[]', description: 'Array of phone numbers, e.g. [{"value":"+49...","type":"MOBILE"}]' },
			{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '', placeholder: 'e.g. 40764' },
			{ displayName: 'Province', name: 'province', type: 'string', default: '' },
			{ displayName: 'Salutation', name: 'salutation', type: 'string', default: '' },
			{ displayName: 'Street', name: 'street', type: 'string', default: '', placeholder: 'e.g. Hauptstr.' },
		],
	};
}

/** The Parcel Dimensions collection. */
function dimensionsField(operation: string[]): INodeProperties {
	return {
		displayName: 'Dimensions',
		name: 'dimensions',
		type: 'collection',
		placeholder: 'Add Dimension',
		default: {},
		displayOptions: show(operation),
		description: 'Physical dimensions of the parcel',
		options: [
			{ displayName: 'Custom Weight', name: 'customWeight', type: 'number', default: 0 },
			{ displayName: 'Height', name: 'height', type: 'number', default: 0 },
			{ displayName: 'Length', name: 'length', type: 'number', default: 0 },
			{ displayName: 'Weight', name: 'weight', type: 'number', default: 0 },
			{ displayName: 'Width', name: 'width', type: 'number', default: 0 },
		],
	};
}

/** The Parcel Services collection (boolean flags). */
function servicesField(operation: string[]): INodeProperties {
	const flags: Array<[string, string]> = [
		['additionalTransportInsurance', 'Additional Transport Insurance'],
		['adultSignature', 'Adult Signature'],
		['bulkyGoods', 'Bulky Goods'],
		['customerSignature', 'Customer Signature'],
		['handoverToRecipientOnly', 'Handover To Recipient Only'],
		['identityAgeCheck18', 'Identity Age Check 18'],
		['identityCheckCompany', 'Identity Check Company'],
		['identityCheckPrivate', 'Identity Check Private'],
		['noNeighborDelivery', 'No Neighbor Delivery'],
		['saturdayDelivery', 'Saturday Delivery'],
		['signature', 'Signature'],
	];
	return {
		displayName: 'Services',
		name: 'services',
		type: 'collection',
		placeholder: 'Add Service',
		default: {},
		displayOptions: show(operation),
		description: 'Carrier services requested for the parcel',
		options: flags.map(([name, displayName]) => ({
			displayName,
			name,
			type: 'boolean' as const,
			default: false,
		})),
	};
}

/** The Parcel Pick-Up Information collection. */
function pickUpField(operation: string[]): INodeProperties {
	return {
		displayName: 'Pick-Up Information',
		name: 'pickUpInformation',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(operation),
		description: 'Pick-up time window. Both start and end are required together.',
		options: [
			{ displayName: 'End Time', name: 'endTime', type: 'dateTime', default: '' },
			{ displayName: 'Start Time', name: 'startTime', type: 'dateTime', default: '' },
		],
	};
}

// ---------------------------------------------------------------------------
//  Operations
// ---------------------------------------------------------------------------

export const shipmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: RESOURCE } },
		options: [
			{ name: 'Create Parcel', value: 'createParcel', description: 'Create a standalone parcel', action: 'Create a parcel' },
			{ name: 'Create Return Note', value: 'createReturnNote', description: 'Create a return note', action: 'Create a return note' },
			{ name: 'Create Shipment', value: 'createShipment', description: 'Create a shipment', action: 'Create a shipment' },
			{ name: 'Create Shipment Parcel', value: 'createShipmentParcel', description: 'Create a parcel for an existing shipment', action: 'Create a shipment parcel' },
			{ name: 'Get Parcel', value: 'getParcel', description: 'Retrieve a single parcel', action: 'Get a parcel' },
			{ name: 'Get Parcel Delivery Note', value: 'getParcelDeliveryNote', description: 'Download the delivery note PDF of a parcel', action: 'Get a parcel delivery note' },
			{ name: 'Get Parcel Label', value: 'getParcelLabel', description: 'Download a label PDF of a parcel', action: 'Get a parcel label' },
			{ name: 'Get Parcel Return Note', value: 'getParcelReturnNote', description: 'Download the return note PDF of a parcel', action: 'Get a parcel return note' },
			{ name: 'Get Parcel Transfer Label', value: 'getParcelTransferLabel', description: 'Download the transfer label PDF of a parcel', action: 'Get a parcel transfer label' },
			{ name: 'Get Shipment', value: 'getShipment', description: 'Retrieve a single shipment', action: 'Get a shipment' },
			{ name: 'Get Shipment Delivery Note', value: 'getShipmentDeliveryNote', description: 'Download the delivery note PDF of a shipment', action: 'Get a shipment delivery note' },
			{ name: 'List Parcels', value: 'listParcels', description: 'Retrieve many parcels', action: 'List parcels' },
			{ name: 'List Shipments', value: 'listShipments', description: 'Retrieve many shipments', action: 'List shipments' },
			{ name: 'Search Parcels', value: 'searchParcels', description: 'Find parcels matching a set of conditions', action: 'Search parcels' },
			{ name: 'Search Shipments', value: 'searchShipments', description: 'Find shipments matching a set of conditions', action: 'Search shipments' },
			{ name: 'Update Parcel', value: 'updateParcel', description: 'Update a parcel', action: 'Update a parcel' },
			{ name: 'Update Shipment', value: 'updateShipment', description: 'Update a shipment', action: 'Update a shipment' },
		],
		default: 'searchShipments',
	},
];

// ---------------------------------------------------------------------------
//  Fields
// ---------------------------------------------------------------------------

export const shipmentFields: INodeProperties[] = [
	// ----- identifiers -----
	{
		displayName: 'Parcel ID',
		name: 'parcelId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(PARCEL_ID_OPS),
		description: 'The parcel to operate on',
	},
	{
		displayName: 'Shipment ID',
		name: 'shipmentId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(SHIPMENT_ID_OPS),
		description: 'The shipment to operate on',
	},
	{
		displayName: 'Label Document',
		name: 'labelDocument',
		type: 'options',
		default: 'all.pdf',
		displayOptions: show(['getParcelLabel']),
		description: 'Which label document to download',
		options: [
			{ name: 'All (PDF)', value: 'all.pdf' },
			{ name: 'All (ZPL)', value: 'all.zpl' },
			{ name: 'Customs (PDF)', value: 'customs.pdf' },
			{ name: 'Customs (ZPL)', value: 'customs.zpl' },
			{ name: 'Return (PDF)', value: 'return.pdf' },
			{ name: 'Return (ZPL)', value: 'return.zpl' },
			{ name: 'Send (PDF)', value: 'send.pdf' },
			{ name: 'Send (ZPL)', value: 'send.zpl' },
		],
	},
	{
		displayName: 'Put Output File in Field',
		name: 'outputBinaryPropertyName',
		type: 'string',
		required: true,
		default: 'data',
		placeholder: 'e.g. data',
		displayOptions: show([...PARCEL_DOWNLOAD_OPS, 'getShipmentDeliveryNote']),
		hint: 'The name of the output binary field to put the downloaded PDF in',
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
		displayOptions: show(['listShipments']),
		options: [
			{ displayName: 'Anonymized', name: 'anonymized', type: 'boolean', default: false },
			{ displayName: 'Carrier Keys', name: 'carrierKeys', type: 'string', default: '', placeholder: 'e.g. DHL, DPD', description: 'Comma-separated carrier keys' },
			{ displayName: 'Carrier Ref', name: 'carrierRef', type: 'string', default: '' },
			{ displayName: 'End Target Time', name: 'endTargetTime', type: 'dateTime', default: '' },
			{ displayName: 'Facility Ref', name: 'facilityRef', type: 'string', default: '' },
			{
				displayName: 'Parcel Status',
				name: 'parcelStatus',
				type: 'multiOptions',
				default: [],
				options: PARCEL_STATUS_OPTIONS,
			},
			{ displayName: 'Pick Job Ref', name: 'pickJobRef', type: 'string', default: '' },
			{ displayName: 'Search Term', name: 'searchTerm', type: 'string', default: '' },
			{ displayName: 'Start Target Time', name: 'startTargetTime', type: 'dateTime', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				default: [],
				options: SHIPMENT_STATUS_OPTIONS,
			},
			{ displayName: 'Tenant Order ID', name: 'tenantOrderId', type: 'string', default: '' },
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

	// ======================= PARCEL CREATE =======================
	{
		displayName: 'Items',
		name: 'items',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Item',
		default: {},
		displayOptions: show(PARCEL_CREATE_OPS),
		description: 'The articles contained in the parcel',
		options: [
			{
				name: 'item',
				displayName: 'Item',
				// Ordered for UX (identifiers first) rather than alphabetically.
				 
				values: articleValues([
					{ displayName: 'Description', name: 'description', type: 'string', default: '' },
					{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the item' },
				]),
			},
		],
	},
	addressField('invoice', 'Invoice Address', PARCEL_CREATE_OPS),
	addressField('recipient', 'Recipient Address', PARCEL_CREATE_OPS),
	dimensionsField(PARCEL_STRUCT_OPS),
	servicesField(PARCEL_STRUCT_OPS),
	pickUpField(PARCEL_STRUCT_OPS),
	transfersField(PARCEL_CREATE_OPS),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(PARCEL_CREATE_OPS),
		options: [
			{ displayName: 'Carrier Product', name: 'carrierProduct', type: 'string', default: '', placeholder: 'e.g. EXPRESS' },
			{
				displayName: 'Carrier Ref',
				name: 'carrierRef',
				type: 'string',
				default: '',
				description: 'Carrier to use. Ignored when creating a parcel for an existing shipment.',
			},
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}' },
			{ displayName: 'Custom Product Value', name: 'customProductValue', type: 'number', default: 0, description: 'Overwrites the calculated product value of the parcel' },
			{ displayName: 'Load Unit Refs', name: 'loadUnitRefs', type: 'string', default: '', placeholder: 'e.g. lu-1, lu-2', description: 'Comma-separated load unit references' },
			{ displayName: 'Parent Ref', name: 'parentRef', type: 'string', default: '', description: 'Reference to the parent container of this parcel' },
			{ displayName: 'Payment Currency', name: 'paymentCurrency', type: 'string', default: '', placeholder: 'e.g. EUR' },
			{ displayName: 'Product Value', name: 'productValue', type: 'number', default: 0, description: 'Monetary value of all goods for customs' },
			{ displayName: 'Product Value Currency', name: 'productValueCurrency', type: 'string', default: '', placeholder: 'e.g. EUR' },
			{ displayName: 'Product Value Decimal Places', name: 'productValueDecimalPlaces', type: 'number', default: 2 },
			{
				displayName: 'Product Value Type',
				name: 'productValueType',
				type: 'options',
				default: 'CUSTOMS',
				options: PRODUCT_VALUE_TYPE_OPTIONS,
			},
			{ displayName: 'Shipping Container Number', name: 'shippingContainerNumber', type: 'string', default: '', description: 'Carrier information: shipping container number' },
			{ displayName: 'Short ID', name: 'shortId', type: 'string', default: '', placeholder: 'e.g. AA12-1' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'OPEN',
				options: PARCEL_STATUS_OPTIONS,
			},
			{ displayName: 'Tenant Order ID', name: 'tenantOrderId', type: 'string', default: '' },
			{ displayName: 'Tenant Parcel ID', name: 'tenantParcelId', type: 'string', default: '' },
		],
	},
	{ displayName: 'Sender (JSON)', name: 'sender', type: 'json', default: '{}', displayOptions: show(PARCEL_CREATE_OPS), description: 'Sender facility address. See FacilityAddress in the API reference.' },
	{ displayName: 'Return Address (JSON)', name: 'returnAddress', type: 'json', default: '{}', displayOptions: show(PARCEL_CREATE_OPS), description: 'Return facility address. See FacilityAddress in the API reference.' },
	{ displayName: 'Result (JSON)', name: 'result', type: 'json', default: '{}', displayOptions: show(PARCEL_CREATE_OPS), description: 'Carrier result data. See ParcelResult in the API reference.' },
	{ displayName: 'Additional Body Fields (JSON)', name: 'additionalBodyFields', type: 'json', default: '{}', displayOptions: show(PARCEL_CREATE_OPS), description: 'Advanced: raw JSON merged into the parcel for any field not listed above. See ParcelForCreation.' },

	// ======================= PARCEL UPDATE =======================
	{
		displayName: 'Version',
		name: 'version',
		type: 'number',
		required: true,
		default: 1,
		displayOptions: show(['updateParcel', 'updateShipment']),
		description: 'Current version, required for optimistic locking. Retrieve it first with the Get operation.',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['updateParcel']),
		description: 'Changes applied to the parcel as a ModifyParcel action',
		options: [
			{ displayName: 'Carrier Product', name: 'carrierProduct', type: 'string', default: '', description: 'Only changeable while the parcel is OPEN or FAILED' },
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}' },
			{ displayName: 'Custom Product Value', name: 'customProductValue', type: 'number', default: 0 },
			{ displayName: 'Load Unit Refs', name: 'loadUnitRefs', type: 'string', default: '', placeholder: 'e.g. lu-1, lu-2', description: 'Comma-separated load unit refs (sent as a ModifyParcelLoadUnit action)' },
			{ displayName: 'Product Value', name: 'productValue', type: 'number', default: 0 },
			{ displayName: 'Result (JSON)', name: 'result', type: 'json', default: '{}', description: 'Carrier result data. See ParcelResult in the API reference.' },
			{ displayName: 'Shipping Container Number', name: 'shippingContainerNumber', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'PROCESSING',
				options: PARCEL_STATUS_OPTIONS,
			},
			{ displayName: 'Tenant Parcel ID', name: 'tenantParcelId', type: 'string', default: '' },
		],
	},

	// ======================= SHIPMENT CREATE =======================
	{
		displayName: 'Facility',
		name: 'facilityRef',
		type: 'resourceLocator',
		required: true,
		default: { mode: 'list', value: '' },
		displayOptions: show(['createShipment']),
		description: 'The facility the shipment is sent from',
		modes: [
			{ displayName: 'From List', name: 'list', type: 'list', typeOptions: { searchListMethod: 'searchFacilities', searchable: true } },
			{ displayName: 'By ID', name: 'id', type: 'string', placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63' },
		],
	},
	{
		displayName: 'Order Date',
		name: 'orderDate',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: show(['createShipment']),
		description: 'The date the order was placed',
	},
	{
		displayName: 'Target Time',
		name: 'targetTime',
		type: 'dateTime',
		required: true,
		default: '',
		displayOptions: show(['createShipment']),
		description: 'When the shipment must be finished',
	},
	{
		displayName: 'Line Items',
		name: 'lineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		displayOptions: show(['createShipment']),
		description: 'The articles in the shipment',
		options: [
			{
				name: 'item',
				displayName: 'Line Item',
				// Ordered for UX (identifiers first) rather than alphabetically.
				 
				values: articleValues([
					{ displayName: 'Measurement Unit Key', name: 'measurementUnitKey', type: 'string', default: '', placeholder: 'e.g. pcs' },
					{ displayName: 'Scannable Codes', name: 'scannableCodes', type: 'string', default: '', placeholder: 'e.g. 4711, 4712', description: 'Comma-separated scannable codes' },
					tagsField('tags'),
					RECORDABLE_ATTRIBUTES_FIELD,
					{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}', description: 'Free-form attributes stored on the line item' },
				]),
			},
		],
	},
	addressField('invoiceAddress', 'Invoice Address', ['createShipment']),
	addressField('postalAddress', 'Postal Address', ['createShipment']),
	addressField('targetAddress', 'Target Address', ['createShipment', 'updateShipment']),
	transfersField(['createShipment']),
	{
		...tagsField('shipmentTags', 'Tags for the shipment'),
		displayOptions: show(['createShipment']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createShipment']),
		options: [
			{ displayName: 'Carrier Logo URL', name: 'carrierLogoUrl', type: 'string', default: '' },
			{ displayName: 'Carrier Product', name: 'carrierProduct', type: 'string', default: '', placeholder: 'e.g. EXPRESS' },
			{ displayName: 'Carrier Ref', name: 'carrierRef', type: 'string', default: '' },
			{ displayName: 'Custom Attributes (JSON)', name: 'customAttributes', type: 'json', default: '{}' },
			{ displayName: 'Operative Process Ref', name: 'operativeProcessRef', type: 'string', default: '' },
			{ displayName: 'Payment Currency', name: 'paymentCurrency', type: 'string', default: '', placeholder: 'e.g. EUR' },
			{ displayName: 'Pick Job Ref', name: 'pickJobRef', type: 'string', default: '' },
			{ displayName: 'Process ID', name: 'processId', type: 'string', default: '' },
			{ displayName: 'Short ID', name: 'shortId', type: 'string', default: '' },
			{ displayName: 'Target Time Base Date', name: 'targetTimeBaseDate', type: 'dateTime', default: '' },
			{ displayName: 'Tenant Order ID', name: 'tenantOrderId', type: 'string', default: '' },
		],
	},
	{ displayName: 'Source Address (JSON)', name: 'sourceAddress', type: 'json', default: '{}', displayOptions: show(['createShipment']), description: 'Source facility address. See FacilityAddress in the API reference.' },
	{ displayName: 'Carrier Services (JSON)', name: 'carrierServices', type: 'json', default: '{}', displayOptions: show(['createShipment']), description: 'Carrier services. See CarrierServices in the API reference.' },
	{ displayName: 'Additional Body Fields (JSON)', name: 'additionalBodyFields', type: 'json', default: '{}', displayOptions: show(['createShipment']), description: 'Advanced: raw JSON merged into the shipment. See ShipmentForCreation.' },

	// ======================= SHIPMENT UPDATE =======================
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['updateShipment']),
		description: 'Changes applied to the shipment as a ModifyShipment action',
		options: [
			{ displayName: 'Carrier Product', name: 'carrierProduct', type: 'string', default: '', placeholder: 'e.g. EXPRESS' },
			{ displayName: 'Carrier Ref', name: 'carrierRef', type: 'string', default: '' },
			{ displayName: 'Payment Currency', name: 'paymentCurrency', type: 'string', default: '', placeholder: 'e.g. EUR' },
			{ displayName: 'Pick Job Ref', name: 'pickJobRef', type: 'string', default: '' },
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'CONFIRMED',
				options: SHIPMENT_STATUS_OPTIONS,
			},
		],
	},

	// shared: Additional Actions for both patch operations
	{
		displayName: 'Additional Actions (JSON)',
		name: 'additionalActions',
		type: 'json',
		default: '[]',
		displayOptions: show(['updateParcel', 'updateShipment']),
		description: 'Advanced: extra patch actions appended after the ones above',
	},

	// ======================= RETURN NOTE CREATE =======================
	{
		displayName: 'Order Information',
		name: 'orderInformation',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createReturnNote']),
		description: 'Information about the order the return note is for',
		options: [
			{ displayName: 'Order Date', name: 'orderDate', type: 'dateTime', default: '' },
			{ displayName: 'Order Number', name: 'orderNumber', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Items',
		name: 'items',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Item',
		default: {},
		required: true,
		displayOptions: show(['createReturnNote']),
		description: 'The items on the return note',
		options: [
			{
				name: 'item',
				displayName: 'Item',
				// Ordered for UX (title first) rather than alphabetically.
				 
				values: [
					{ displayName: 'Title', name: 'title', type: 'string', required: true, default: '', description: 'Title of the item' },
					{ displayName: 'ID', name: 'id', type: 'string', default: '' },
					{ displayName: 'Quantity', name: 'quantity', type: 'number', default: 1, typeOptions: { minValue: 0 } },
					{ displayName: 'Substitutes', name: 'substitutes', type: 'string', default: '', placeholder: 'e.g. a, b', description: 'Comma-separated substitute references' },
				],
			},
		],
	},
	{
		displayName: 'Company Address',
		name: 'companyAddress',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createReturnNote']),
		options: [
			{ displayName: 'City', name: 'city', type: 'string', default: '' },
			{ displayName: 'Country', name: 'country', type: 'string', default: '', placeholder: 'e.g. DE' },
			{ displayName: 'House Number', name: 'houseNumber', type: 'string', default: '' },
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
			{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
			{ displayName: 'Street', name: 'street', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Delivery Address',
		name: 'deliveryAddress',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['createReturnNote']),
		options: [
			{ displayName: 'City', name: 'city', type: 'string', default: '' },
			{ displayName: 'Company Name', name: 'companyName', type: 'string', default: '' },
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '' },
			{ displayName: 'House Number', name: 'houseNumber', type: 'string', default: '' },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '' },
			{ displayName: 'Personal Title', name: 'personalTitle', type: 'string', default: '' },
			{ displayName: 'Postal Code', name: 'postalCode', type: 'string', default: '' },
			{ displayName: 'Street', name: 'street', type: 'string', default: '' },
		],
	},
	{ displayName: 'QR Code Content', name: 'qrCodeContent', type: 'string', default: '', displayOptions: show(['createReturnNote']), description: 'Content encoded into the return note QR code' },
	{ displayName: 'Delivery Addresses (JSON)', name: 'deliveryAddresses', type: 'json', default: '[]', displayOptions: show(['createReturnNote']), description: 'Array of typed delivery addresses. See DeliveryAddressWithType in the API reference.' },
];
