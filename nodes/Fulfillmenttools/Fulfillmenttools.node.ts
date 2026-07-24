import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	buildManagedFacilityForCreation,
	buildManagedFacilityForModification,
	buildSupplierForCreation,
	simplifyFacility,
} from './FacilityFunctions';
import {
	fulfillmenttoolsApiRequest,
	fulfillmenttoolsApiRequestAllItems,
	fulfillmenttoolsApiRequestFile,
	fulfillmenttoolsSearchRequest,
} from './GenericFunctions';
import {
	buildExternalDocumentForCreation,
	buildExternalDocumentForUpdate,
	requireDocumentId,
	resolveDownloadFileName,
	simplifyProcess,
} from './ProcessFunctions';
import {
	buildListingBulkUpsert,
	buildListingPatchActions,
	buildListingsForReplacement,
	simplifyListing,
} from './ListingFunctions';
import {
	buildPickJobForCreation,
	buildPickRunForCreation,
	buildPickRunPatchAction,
	buildPickRunPickJobsPatchAction,
	simplifyPickJob,
} from './PickjobFunctions';
import {
	buildPackJobForCreation,
	buildPackJobPatchActions,
	simplifyPackJob,
} from './PackjobFunctions';
import {
	buildHandoverjobForCreation,
	buildHandoverjobPatchActions,
	simplifyHandoverjob,
} from './HandoverFunctions';
import {
	buildParcelForCreation,
	buildParcelPatchActions,
	buildReturnNote,
	buildShipmentForCreation,
	buildShipmentPatchActions,
	simplifyParcel,
	simplifyShipment,
} from './ShipmentFunctions';
import {
	buildCustomServiceForCreation,
	buildCustomServiceForUpdate,
	buildServiceJobForCreation,
	buildServiceJobLink,
	simplifyCustomService,
	simplifyFacilityCustomServiceConnection,
	simplifyLinkedServiceJobs,
	simplifyServiceJob,
} from './ServiceFunctions';
import {
	buildAddItemReturn,
	buildItemReturnJobForCreation,
	buildItemReturnLineItemForUpdate,
	buildReplaceReturnedLineItems,
	simplifyItemReturn,
	simplifyItemReturnJob,
} from './ReturnFunctions';
import { simplifyRoutingPlan } from './RoutingPlanFunctions';
import { searchConfigs, searchConfigsByOperation } from './SearchConfigs';
import { buildSearchPayload } from './SearchFunctions';
import { buildOrderForCreation, buildOrderForUpdate, simplifyOrder } from './OrderFunctions';
import {
	buildCarrierForCreation,
	buildCarrierPatchActions,
	simplifyCarrier,
} from './CarrierFunctions';
import {
	buildFacilityCarrierConnectionForCreation,
	buildFacilityCarrierConnectionForModification,
	simplifyFacilityCarrierConnection,
} from './FacilityCarrierConnectionFunctions';
import {
	buildInboundProcessForCreation,
	buildInboundProcessForPatch,
	buildInboundPurchaseOrderForUpsert,
	buildInboundReceiptForCreation,
	simplifyInboundProcess,
} from './InboundFunctions';
import {
	carrierFields,
	carrierOperations,
	facilityCarrierConnectionFields,
	facilityCarrierConnectionOperations,
	facilityFields,
	facilityOperations,
	facilitySearchFields,
	inboundFields,
	inboundOperations,
	inboundSearchFields,
	orderFields,
	orderOperations,
	orderSearchFields,
	listingFields,
	listingOperations,
	listingSearchFields,
	handoverFields,
	handoverOperations,
	handoverSearchFields,
	shipmentFields,
	shipmentOperations,
	shipmentSearchFields,
	serviceFields,
	serviceOperations,
	linkedServiceJobsSearchFields,
	returnFields,
	returnOperations,
	routingPlanFields,
	routingPlanOperations,
	routingPlanSearchFields,
	parcelSearchFields,
	packjobFields,
	packjobOperations,
	packjobSearchFields,
	pickjobFields,
	pickjobOperations,
	pickjobSearchFields,
	processFields,
	processOperations,
	processSearchFields,
} from './descriptions';

export class Fulfillmenttools implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'fulfillmenttools',
		name: 'fulfillmenttools',
		icon: { light: 'file:fftBrand.svg', dark: 'file:fftBrand.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the fulfillmenttools REST API',
		defaults: {
			name: 'fulfillmenttools',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'fulfillmenttoolsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Carrier',
						value: 'carrier',
					},
					{
						name: 'Facility',
						value: 'facility',
					},
					{
						name: 'Facility Carrier Connection',
						value: 'facilityCarrierConnection',
					},
					{
						name: 'Handover Job',
						value: 'handover',
					},
					{
						name: 'Inbound',
						value: 'inbound',
					},
					{
						name: 'Listing',
						value: 'listing',
					},
					{
						name: 'Order',
						value: 'order',
					},
					{
						name: 'Pack Job',
						value: 'packjob',
					},
					{
						name: 'Pick Job',
						value: 'pickjob',
					},
					{
						name: 'Process',
						value: 'process',
					},
					{
						name: 'Return',
						value: 'return',
					},
					{
						name: 'Routing Plan',
						value: 'routingplan',
					},
					{
						name: 'Service',
						value: 'service',
					},
					{
						name: 'Shipment',
						value: 'shipment',
					},
				],
				default: 'facility',
			},

			// Facility
			...facilityOperations,
			...facilityFields,
			...facilitySearchFields,

			// Order
			...orderOperations,
			...orderFields,
			...orderSearchFields,

			// Carrier
			...carrierOperations,
			...carrierFields,

			// Facility Carrier Connection
			...facilityCarrierConnectionOperations,
			...facilityCarrierConnectionFields,

			// Handover Job
			...handoverOperations,
			...handoverFields,
			...handoverSearchFields,

			// Inbound
			...inboundOperations,
			...inboundFields,
			...inboundSearchFields,

			// Pack Job
			...packjobOperations,
			...packjobFields,
			...packjobSearchFields,

			// Pick Job
			...pickjobOperations,
			...pickjobFields,
			...pickjobSearchFields,

			// Process
			...processOperations,
			...processFields,
			...processSearchFields,

			// Listing
			...listingOperations,
			...listingFields,
			...listingSearchFields,

			// Return (item return jobs + item returns)
			...returnOperations,
			...returnFields,

			// Routing Plan
			...routingPlanOperations,
			...routingPlanFields,
			...routingPlanSearchFields,

			// Service (service jobs + linked service jobs)
			...serviceOperations,
			...serviceFields,
			...linkedServiceJobsSearchFields,

			// Shipment (parcels + shipments)
			...shipmentOperations,
			...shipmentFields,
			...parcelSearchFields,
			...shipmentSearchFields,
		],
	};

	methods = {
		listSearch: {
			async searchFacilities(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const facilities = await fulfillmenttoolsApiRequestAllItems.call(
					this,
					'/api/facilities',
					'facilities',
				);
				const results = facilities
					.map((facility) => ({
						name: (facility.name as string) || (facility.id as string),
						value: facility.id as string,
					}))
					.filter(
						(option) => !filter || option.name.toLowerCase().includes(filter.toLowerCase()),
					);
				return { results };
			},

			async searchOrders(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const orders = await fulfillmenttoolsApiRequestAllItems.call(
					this,
					'/api/orders',
					'orders',
				);
				const results = orders
					.map((order) => ({
						name: (order.tenantOrderId as string) || (order.id as string),
						value: order.id as string,
					}))
					.filter(
						(option) => !filter || option.name.toLowerCase().includes(filter.toLowerCase()),
					);
				return { results };
			},

			async searchCarriers(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const carriers = await fulfillmenttoolsApiRequestAllItems.call(
					this,
					'/api/carriers',
					'carriers',
				);
				const results = carriers
					.map((carrier) => ({
						name: (carrier.name as string) || (carrier.id as string),
						value: carrier.id as string,
					}))
					.filter(
						(option) => !filter || option.name.toLowerCase().includes(filter.toLowerCase()),
					);
				return { results };
			},

			/**
			 * Processes are listed through the search endpoint — the legacy
			 * `GET /api/processes` is deprecated. The typed filter is passed to the
			 * API's full-text `searchTerm` rather than filtered client-side, since
			 * there can be far too many processes to fetch them all.
			 */
			async searchProcesses(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const query: IDataObject = filter ? { searchTerm: { like: filter } } : {};
				let processes: IDataObject[];
				try {
					processes = await fulfillmenttoolsSearchRequest.call(
						this,
						'/api/processes/search',
						'processes',
						{ query },
						100,
					);
				} catch {
					throw new NodeOperationError(
						this.getNode(),
						'The list of processes could not be loaded',
						{
							description:
								"Listing processes uses POST /api/processes/search, an Alpha endpoint that needs the PROCESS_READ permission. Switch the 'Process' field to 'By ID' to enter an ID directly instead.",
						},
					);
				}
				const results = processes.map((process) => ({
					name: (process.tenantOrderId as string) || (process.id as string),
					value: process.id as string,
				}));
				return { results };
			},

			async searchInboundProcesses(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const processes = await fulfillmenttoolsApiRequestAllItems.call(
					this,
					'/api/inboundprocesses',
					'inboundProcesses',
				);
				const results = processes
					.map((process) => ({
						name: (process.tenantInboundProcessId as string) || (process.id as string),
						value: process.id as string,
					}))
					.filter(
						(option) => !filter || option.name.toLowerCase().includes(filter.toLowerCase()),
					);
				return { results };
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] = {};

				// The `POST /api/{entity}/search` endpoints share one implementation,
				// driven by the per-resource field registry in `SearchConfigs.ts`.
				if (operation === 'search') {
					const searchConfig = searchConfigs[resource];
					if (!searchConfig) {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;

					responseData = await fulfillmenttoolsSearchRequest.call(
						this,
						searchConfig.endpoint,
						searchConfig.propertyName,
						buildSearchPayload(this, i, searchConfig),
						returnAll ? undefined : (this.getNodeParameter('limit', i) as number),
					);
				} else if (resource === 'facility') {
					if (operation === 'create') {
						const body = buildManagedFacilityForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/facilities',
							body,
						)) as IDataObject;
					} else if (operation === 'createSupplier') {
						const body = buildSupplierForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/facilities',
							body,
						)) as IDataObject;
					} else if (operation === 'get') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/facilities/${encodeURIComponent(facilityId)}`,
						)) as IDataObject;
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						const qs: IDataObject = {};
						if (filters.orderBy) qs.orderBy = filters.orderBy;
						if (filters.tenantFacilityId) qs.tenantFacilityId = filters.tenantFacilityId;
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;
						if (Array.isArray(filters.type) && filters.type.length) qs.type = filters.type;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/facilities',
								'facilities',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/facilities',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.facilities as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'update') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;
						const body = buildManagedFacilityForModification(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/facilities/${encodeURIComponent(facilityId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'delete') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;
						const forceDeletion = this.getNodeParameter('forceDeletion', i, false) as boolean;

						await fulfillmenttoolsApiRequest.call(
							this,
							'DELETE',
							`/api/facilities/${encodeURIComponent(facilityId)}`,
							{},
							forceDeletion ? { forceDeletion: true } : {},
						);
						responseData = { deleted: true };
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'order') {
					if (operation === 'create') {
						const body = buildOrderForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/orders',
							body,
						)) as IDataObject;
					} else if (operation === 'get') {
						const orderId = this.getNodeParameter('orderId', i, '', {
							extractValue: true,
						}) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/orders/${encodeURIComponent(orderId)}`,
						)) as IDataObject;
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						const qs: IDataObject = {};
						if (filters.tenantOrderId) qs.tenantOrderId = filters.tenantOrderId;
						if (filters.consumerId) qs.consumerId = filters.consumerId;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/orders',
								'orders',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/orders',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.orders as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'update') {
						const orderId = this.getNodeParameter('orderId', i, '', {
							extractValue: true,
						}) as string;
						const body = buildOrderForUpdate(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/orders/${encodeURIComponent(orderId)}`,
							body,
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'carrier') {
					if (operation === 'create') {
						const body = buildCarrierForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/carriers',
							body,
						)) as IDataObject;
					} else if (operation === 'get') {
						const carrierId = this.getNodeParameter('carrierId', i, '', {
							extractValue: true,
						}) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/carriers/${encodeURIComponent(carrierId)}`,
						)) as IDataObject;
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/carriers',
								'carriers',
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/carriers',
								{},
								{ size: limit },
							)) as IDataObject;
							responseData = ((response.carriers as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'update') {
						const carrierId = this.getNodeParameter('carrierId', i, '', {
							extractValue: true,
						}) as string;
						const body = buildCarrierPatchActions(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/carriers/${encodeURIComponent(carrierId)}`,
							body,
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'facilityCarrierConnection') {
					const facilityId = this.getNodeParameter('facilityId', i, '', {
						extractValue: true,
					}) as string;
					const basePath = `/api/facilities/${encodeURIComponent(facilityId)}/carriers`;

					if (operation === 'getAll') {
						const response = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							basePath,
						)) as IDataObject;
						responseData = (response.carriers as IDataObject[]) ?? [];
					} else {
						const carrierRef = this.getNodeParameter('carrierRef', i, '', {
							extractValue: true,
						}) as string;
						const path = `${basePath}/${encodeURIComponent(carrierRef)}`;

						if (operation === 'get') {
							responseData = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								path,
							)) as IDataObject;
						} else if (operation === 'create') {
							const body = buildFacilityCarrierConnectionForCreation(this, i);
							responseData = (await fulfillmenttoolsApiRequest.call(
								this,
								'POST',
								path,
								body,
							)) as IDataObject;
						} else if (operation === 'update') {
							const body = buildFacilityCarrierConnectionForModification(this, i);
							responseData = (await fulfillmenttoolsApiRequest.call(
								this,
								'PUT',
								path,
								body,
							)) as IDataObject;
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`The operation "${operation}" is not supported for resource "${resource}"`,
								{ itemIndex: i },
							);
						}
					}
				} else if (resource === 'routingplan') {
					if (operation === 'list') {
						const orderRef = this.getNodeParameter('orderRef', i, '') as string;
						const response = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							'/api/routingplans',
							{},
							orderRef ? { orderRef } : {},
						)) as IDataObject;
						responseData = (response.routingPlans as IDataObject[]) ?? [];
					} else if (operation === 'get') {
						const routingplanId = this.getNodeParameter('routingplanId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/routingplans/${encodeURIComponent(routingplanId)}`,
						)) as IDataObject;
					} else if (operation === 'listGraphs') {
						const processRef = this.getNodeParameter('processRef', i, '') as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							'/api/routingplansgraph',
							{},
							processRef ? { processRef } : {},
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'return') {
					if (operation === 'listJobs') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						for (const key of ['facilityId', 'searchTerm'] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (filters.anonymized !== undefined) qs.anonymized = filters.anonymized;
						for (const [param, key] of [
							['itemReturnJobStatus', 'itemReturnJobStatus'],
							['itemReturnStatus', 'itemReturnStatus'],
						] as const) {
							if (Array.isArray(filters[param]) && (filters[param] as string[]).length) {
								qs[key] = filters[param];
							}
						}
						for (const [param, key] of [
							['itemReturnJobScannableCodes', 'itemReturnJobScannableCodes'],
							['itemReturnScannableCodes', 'itemReturnScannableCodes'],
						] as const) {
							const codes = ((filters[param] as string) ?? '')
								.split(',')
								.map((entry) => entry.trim())
								.filter((entry) => entry !== '');
							if (codes.length) qs[key] = codes;
						}

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/itemreturnjobs',
								'itemReturnJobsWithSearchPaths',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/itemreturnjobs',
								{},
								qs,
							)) as IDataObject;
							responseData = (
								(response.itemReturnJobsWithSearchPaths as IDataObject[]) ?? []
							).slice(0, limit);
						}
					} else if (operation === 'createJob') {
						const body = buildItemReturnJobForCreation(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/itemreturnjobs',
							body,
						)) as IDataObject;
					} else if (operation === 'listReturns') {
						const itemReturnJobId = this.getNodeParameter('itemReturnJobId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/itemreturnjobs/${encodeURIComponent(itemReturnJobId)}/itemreturns`,
						)) as IDataObject[];
					} else if (operation === 'createReturn') {
						const itemReturnJobId = this.getNodeParameter('itemReturnJobId', i) as string;
						const body = buildAddItemReturn(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							`/api/itemreturnjobs/${encodeURIComponent(itemReturnJobId)}/itemreturns`,
							body,
						)) as IDataObject;
					} else if (operation === 'getReturn') {
						const itemReturnJobId = this.getNodeParameter('itemReturnJobId', i) as string;
						const itemReturnId = this.getNodeParameter('itemReturnId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/itemreturnjobs/${encodeURIComponent(itemReturnJobId)}/itemreturns/${encodeURIComponent(itemReturnId)}`,
						)) as IDataObject;
					} else if (operation === 'updateReturnedLineItems') {
						const itemReturnJobId = this.getNodeParameter('itemReturnJobId', i) as string;
						const itemReturnId = this.getNodeParameter('itemReturnId', i) as string;
						const body = buildReplaceReturnedLineItems(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PUT',
							`/api/itemreturnjobs/${encodeURIComponent(itemReturnJobId)}/itemreturns/${encodeURIComponent(itemReturnId)}/returnedlineitems`,
							body,
						)) as IDataObject;
					} else if (operation === 'updateReturnedLineItem') {
						const itemReturnJobId = this.getNodeParameter('itemReturnJobId', i) as string;
						const itemReturnId = this.getNodeParameter('itemReturnId', i) as string;
						const returnedLineItemId = this.getNodeParameter('returnedLineItemId', i) as string;
						const body = buildItemReturnLineItemForUpdate(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/itemreturnjobs/${encodeURIComponent(itemReturnJobId)}/itemreturns/${encodeURIComponent(itemReturnId)}/returnedlineitems/${encodeURIComponent(returnedLineItemId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'findReturns') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						for (const key of ['searchTerm', 'orderBy'] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (filters.anonymized !== undefined) qs.anonymized = filters.anonymized;
						for (const [param, key] of [
							['itemReturnStatus', 'itemReturnStatus'],
							['itemReturnLineItemStatus', 'itemReturnLineItemStatus'],
						] as const) {
							if (Array.isArray(filters[param]) && (filters[param] as string[]).length) {
								qs[key] = filters[param];
							}
						}
						const facilityRefs = ((filters.facilityRefs as string) ?? '')
							.split(',')
							.map((entry) => entry.trim())
							.filter((entry) => entry !== '');
						if (facilityRefs.length) qs.facilityRefs = facilityRefs;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/itemreturns',
								'itemReturns',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/itemreturns',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.itemReturns as IDataObject[]) ?? []).slice(0, limit);
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'service') {
					if (operation === 'searchLinked') {
						const searchConfig = searchConfigsByOperation[operation];
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						responseData = await fulfillmenttoolsSearchRequest.call(
							this,
							searchConfig.endpoint,
							searchConfig.propertyName,
							buildSearchPayload(this, i, searchConfig),
							returnAll ? undefined : (this.getNodeParameter('limit', i) as number),
						);
					} else if (operation === 'listLinked') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						for (const key of [
							'searchTerm',
							'channel',
							'orderBy',
							'startTargetTime',
							'endTargetTime',
							'modifiedByUsername',
						] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;
						const facilityIds = ((filters.facilityIds as string) ?? '')
							.split(',')
							.map((entry) => entry.trim())
							.filter((entry) => entry !== '');
						if (facilityIds.length) qs.facilityIds = facilityIds;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/linkedservicejobs',
								'linkedServiceJobs',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/linkedservicejobs',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.linkedServiceJobs as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'getLinked') {
						const linkedId = this.getNodeParameter('linkedServiceJobsId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/linkedservicejobs/${encodeURIComponent(linkedId)}`,
						)) as IDataObject;
					} else if (operation === 'createLink') {
						const linkedId = this.getNodeParameter('linkedServiceJobsId', i) as string;
						const body = buildServiceJobLink(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							`/api/linkedservicejobs/${encodeURIComponent(linkedId)}/servicejoblinks`,
							body,
						)) as IDataObject;
					} else if (operation === 'createNestedLink') {
						const linkedId = this.getNodeParameter('linkedServiceJobsId', i) as string;
						const serviceJobLinkId = this.getNodeParameter('serviceJobLinkId', i) as string;
						const body = buildServiceJobLink(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							`/api/linkedservicejobs/${encodeURIComponent(linkedId)}/servicejoblinks/${encodeURIComponent(serviceJobLinkId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'listJobs') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						for (const key of [
							'searchTerm',
							'facilityRef',
							'channel',
							'orderBy',
							'startTargetTime',
							'endTargetTime',
							'assignedUser',
						] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/servicejobs',
								'serviceJobs',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/servicejobs',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.serviceJobs as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'createJob') {
						const body = buildServiceJobForCreation(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/servicejobs',
							body,
						)) as IDataObject;
					} else if (operation === 'getJob') {
						const serviceJobId = this.getNodeParameter('serviceJobId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/servicejobs/${encodeURIComponent(serviceJobId)}`,
						)) as IDataObject;
					} else if (operation === 'listCustomServices') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						if (filters.tenantCustomServiceId) qs.tenantCustomServiceId = filters.tenantCustomServiceId;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/customservices',
								'customServices',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/customservices',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.customServices as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'createCustomService') {
						const body = buildCustomServiceForCreation(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/customservices',
							body,
						)) as IDataObject;
					} else if (operation === 'getCustomService') {
						const customServiceId = this.getNodeParameter('customServiceId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/customservices/${encodeURIComponent(customServiceId)}`,
						)) as IDataObject;
					} else if (operation === 'updateCustomService') {
						const customServiceId = this.getNodeParameter('customServiceId', i) as string;
						const body = buildCustomServiceForUpdate(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/customservices/${encodeURIComponent(customServiceId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'listFacilityCustomServices') {
						const facilityId = this.getNodeParameter('facilityRef', i, '', {
							extractValue: true,
						}) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const endpoint = `/api/facilities/${encodeURIComponent(facilityId)}/customservices`;
						const property = 'facilityCustomServiceConnections';

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								endpoint,
								property,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								endpoint,
								{},
								{ size: limit },
							)) as IDataObject;
							responseData = ((response[property] as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'getFacilityCustomService') {
						const facilityId = this.getNodeParameter('facilityRef', i, '', {
							extractValue: true,
						}) as string;
						const customServiceId = this.getNodeParameter('customServiceId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/facilities/${encodeURIComponent(facilityId)}/customservices/${encodeURIComponent(customServiceId)}`,
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'shipment') {
					const downloadFile = async (endpoint: string, baseName: string, idKey: string, idValue: string) => {
						const outputField = this.getNodeParameter('outputBinaryPropertyName', i, 'data') as string;
						const { body, headers } = await fulfillmenttoolsApiRequestFile.call(this, endpoint);
						const fileName = resolveDownloadFileName(headers, baseName);
						returnData.push({
							json: { [idKey]: idValue, fileName },
							binary: {
								[outputField]: await this.helpers.prepareBinaryData(
									body,
									fileName,
									(headers['content-type'] as string)?.split(';')[0].trim(),
								),
							},
							pairedItem: { item: i },
						});
					};

					if (operation === 'searchParcels' || operation === 'searchShipments') {
						const searchConfig = searchConfigsByOperation[operation];
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						responseData = await fulfillmenttoolsSearchRequest.call(
							this,
							searchConfig.endpoint,
							searchConfig.propertyName,
							buildSearchPayload(this, i, searchConfig),
							returnAll ? undefined : (this.getNodeParameter('limit', i) as number),
						);
					} else if (operation === 'listParcels') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/parcels',
								'parcels',
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/parcels',
								{},
								{ size: limit },
							)) as IDataObject;
							responseData = ((response.parcels as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'getParcel') {
						const parcelId = this.getNodeParameter('parcelId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/parcels/${encodeURIComponent(parcelId)}`,
						)) as IDataObject;
					} else if (operation === 'updateParcel') {
						const parcelId = this.getNodeParameter('parcelId', i) as string;
						const body = buildParcelPatchActions(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/parcels/${encodeURIComponent(parcelId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'createParcel') {
						const body = buildParcelForCreation(this, i, { allowCarrierRef: true });
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/shipments/parcels',
							body,
						)) as IDataObject;
					} else if (operation === 'getParcelDeliveryNote') {
						const parcelId = this.getNodeParameter('parcelId', i) as string;
						await downloadFile(
							`/api/parcels/${encodeURIComponent(parcelId)}/deliverynote`,
							`deliverynote-${parcelId}`,
							'parcelId',
							parcelId,
						);
						continue;
					} else if (operation === 'getParcelLabel') {
						const parcelId = this.getNodeParameter('parcelId', i) as string;
						const labelDocument = this.getNodeParameter('labelDocument', i, 'all.pdf') as string;
						await downloadFile(
							`/api/parcels/${encodeURIComponent(parcelId)}/labels/${encodeURIComponent(labelDocument)}`,
							`label-${parcelId}`,
							'parcelId',
							parcelId,
						);
						continue;
					} else if (operation === 'getParcelReturnNote') {
						const parcelId = this.getNodeParameter('parcelId', i) as string;
						await downloadFile(
							`/api/parcels/${encodeURIComponent(parcelId)}/returnnote`,
							`returnnote-${parcelId}`,
							'parcelId',
							parcelId,
						);
						continue;
					} else if (operation === 'getParcelTransferLabel') {
						const parcelId = this.getNodeParameter('parcelId', i) as string;
						await downloadFile(
							`/api/parcels/${encodeURIComponent(parcelId)}/transferlabel`,
							`transferlabel-${parcelId}`,
							'parcelId',
							parcelId,
						);
						continue;
					} else if (operation === 'listShipments') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						for (const key of [
							'searchTerm',
							'facilityRef',
							'carrierRef',
							'pickJobRef',
							'tenantOrderId',
							'startTargetTime',
							'endTargetTime',
						] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (filters.anonymized !== undefined) qs.anonymized = filters.anonymized;
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;
						if (Array.isArray(filters.parcelStatus) && filters.parcelStatus.length) {
							qs.parcelStatus = filters.parcelStatus;
						}
						const carrierKeys = ((filters.carrierKeys as string) ?? '')
							.split(',')
							.map((entry) => entry.trim())
							.filter((entry) => entry !== '');
						if (carrierKeys.length) qs.carrierKeys = carrierKeys;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/shipments',
								'shipments',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/shipments',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.shipments as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'createShipment') {
						const body = buildShipmentForCreation(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/shipments',
							body,
						)) as IDataObject;
					} else if (operation === 'getShipment') {
						const shipmentId = this.getNodeParameter('shipmentId', i) as string;
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/shipments/${encodeURIComponent(shipmentId)}`,
						)) as IDataObject;
					} else if (operation === 'updateShipment') {
						const shipmentId = this.getNodeParameter('shipmentId', i) as string;
						const body = buildShipmentPatchActions(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/shipments/${encodeURIComponent(shipmentId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'createShipmentParcel') {
						const shipmentId = this.getNodeParameter('shipmentId', i) as string;
						const body = buildParcelForCreation(this, i, { allowCarrierRef: false });
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							`/api/shipments/${encodeURIComponent(shipmentId)}/parcels`,
							body,
						)) as IDataObject;
					} else if (operation === 'getShipmentDeliveryNote') {
						const shipmentId = this.getNodeParameter('shipmentId', i) as string;
						await downloadFile(
							`/api/shipments/${encodeURIComponent(shipmentId)}/deliverynote`,
							`deliverynote-${shipmentId}`,
							'shipmentId',
							shipmentId,
						);
						continue;
					} else if (operation === 'createReturnNote') {
						const body = buildReturnNote(this, i);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/returnnotes',
							body,
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'handover') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						const qs: IDataObject = {};
						for (const key of [
							'searchTerm',
							'facilityRef',
							'pickJobRef',
							'shipmentRef',
							'tenantOrderId',
							'assignedUser',
							'channel',
							'startTargetTime',
							'endTargetTime',
						] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (filters.anonymized !== undefined) qs.anonymized = filters.anonymized;
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;
						const carrierRefs = ((filters.carrierRefs as string) ?? '')
							.split(',')
							.map((entry) => entry.trim())
							.filter((entry) => entry !== '');
						if (carrierRefs.length) qs.carrierRefs = carrierRefs;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/handoverjobs',
								'handoverjobs',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/handoverjobs',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.handoverjobs as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'create') {
						const body = buildHandoverjobForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/handoverjobs',
							body,
						)) as IDataObject;
					} else if (operation === 'get') {
						const handoverjobId = this.getNodeParameter('handoverjobId', i) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/handoverjobs/${encodeURIComponent(handoverjobId)}`,
						)) as IDataObject;
					} else if (operation === 'update') {
						const handoverjobId = this.getNodeParameter('handoverjobId', i) as string;
						const body = buildHandoverjobPatchActions(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/handoverjobs/${encodeURIComponent(handoverjobId)}`,
							body,
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'inbound') {
					if (operation === 'addReceipt') {
						const inboundProcessId = this.getNodeParameter('inboundProcessId', i, '', {
							extractValue: true,
						}) as string;
						const body = buildInboundReceiptForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							`/api/inboundprocesses/${encodeURIComponent(inboundProcessId)}/receipts`,
							body,
						)) as IDataObject;
					} else if (operation === 'create') {
						const body = buildInboundProcessForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/inboundprocesses',
							body,
						)) as IDataObject;
					} else if (operation === 'get') {
						const inboundProcessId = this.getNodeParameter('inboundProcessId', i, '', {
							extractValue: true,
						}) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/inboundprocesses/${encodeURIComponent(inboundProcessId)}`,
						)) as IDataObject;
					} else if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						const qs: IDataObject = {};
						if (filters.sort) qs.sort = filters.sort;
						if (filters.facilityRef) qs.facilityRef = filters.facilityRef;
						if (filters.scannableCode) qs.scannableCode = filters.scannableCode;
						if (filters.searchTerm) qs.searchTerm = filters.searchTerm;
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/inboundprocesses',
								'inboundProcesses',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/inboundprocesses',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.inboundProcesses as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'update') {
						const inboundProcessId = this.getNodeParameter('inboundProcessId', i, '', {
							extractValue: true,
						}) as string;
						const body = buildInboundProcessForPatch(this, i);
						const path = `/api/inboundprocesses/${encodeURIComponent(inboundProcessId)}`;

						// PATCH returns no body; fetch the updated entity to return it.
						await fulfillmenttoolsApiRequest.call(this, 'PATCH', path, body);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							path,
						)) as IDataObject;
					} else if (operation === 'updatePurchaseOrder') {
						const inboundProcessId = this.getNodeParameter('inboundProcessId', i, '', {
							extractValue: true,
						}) as string;
						const body = buildInboundPurchaseOrderForUpsert(this, i);
						const path = `/api/inboundprocesses/${encodeURIComponent(inboundProcessId)}`;

						// PUT returns no body; fetch the updated process to return it.
						await fulfillmenttoolsApiRequest.call(this, 'PUT', `${path}/purchaseorder`, body);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							path,
						)) as IDataObject;
					} else if (operation === 'delete') {
						const inboundProcessId = this.getNodeParameter('inboundProcessId', i, '', {
							extractValue: true,
						}) as string;

						await fulfillmenttoolsApiRequest.call(
							this,
							'DELETE',
							`/api/inboundprocesses/${encodeURIComponent(inboundProcessId)}`,
						);
						responseData = { deleted: true };
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'listing') {
					if (operation === 'getAll') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const endpoint = `/api/facilities/${encodeURIComponent(facilityId)}/listings`;

						const qs: IDataObject = {};
						const tenantArticleIds = ((filters.tenantArticleIds as string) ?? '')
							.split(',')
							.map((entry) => entry.trim())
							.filter((entry) => entry !== '');
						if (tenantArticleIds.length) qs.tenantArticleIds = tenantArticleIds;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								endpoint,
								'listings',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								endpoint,
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.listings as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'get') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;
						const tenantArticleId = this.getNodeParameter('tenantArticleId', i) as string;
						const locale = this.getNodeParameter('locale', i, '') as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/facilities/${encodeURIComponent(facilityId)}/listings/${encodeURIComponent(tenantArticleId)}`,
							{},
							locale ? { locale } : {},
						)) as IDataObject;
					} else if (operation === 'update') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;
						const tenantArticleId = this.getNodeParameter('tenantArticleId', i) as string;
						const body = buildListingPatchActions(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/facilities/${encodeURIComponent(facilityId)}/listings/${encodeURIComponent(tenantArticleId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'delete') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;
						const tenantArticleId = this.getNodeParameter('tenantArticleId', i) as string;

						await fulfillmenttoolsApiRequest.call(
							this,
							'DELETE',
							`/api/facilities/${encodeURIComponent(facilityId)}/listings/${encodeURIComponent(tenantArticleId)}`,
						);
						responseData = { deleted: true };
					} else if (operation === 'upsertPerFacility') {
						const facilityId = this.getNodeParameter('facilityId', i, '', {
							extractValue: true,
						}) as string;
						const body = buildListingsForReplacement(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PUT',
							`/api/facilities/${encodeURIComponent(facilityId)}/listings`,
							body,
						)) as IDataObject;
					} else if (operation === 'bulkUpsert') {
						const body = buildListingBulkUpsert(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PUT',
							'/api/listings',
							body,
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'packjob') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						const qs: IDataObject = {};
						for (const key of [
							'searchTerm',
							'facilityRef',
							'orderRef',
							'pickJobRef',
							'processId',
							'tenantOrderId',
							'shortId',
							'articleTitle',
							'assignedUser',
							'modifiedByUsername',
							'channel',
							'startOrderDate',
							'endOrderDate',
							'startTargetTime',
							'endTargetTime',
						] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (filters.anonymized !== undefined) qs.anonymized = filters.anonymized;
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;
						const sourceContainerCodes = ((filters.sourceContainerCodes as string) ?? '')
							.split(',')
							.map((entry) => entry.trim())
							.filter((entry) => entry !== '');
						if (sourceContainerCodes.length) qs.sourceContainerCodes = sourceContainerCodes;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/packjobs',
								'packJobs',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/packjobs',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.packJobs as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'create') {
						const body = buildPackJobForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/packjobs',
							body,
						)) as IDataObject;
					} else if (operation === 'get') {
						const packJobId = this.getNodeParameter('packJobId', i) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/packjobs/${encodeURIComponent(packJobId)}`,
						)) as IDataObject;
					} else if (operation === 'update') {
						const packJobId = this.getNodeParameter('packJobId', i) as string;
						const body = buildPackJobPatchActions(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/packjobs/${encodeURIComponent(packJobId)}`,
							body,
						)) as IDataObject;
					} else if (
						operation === 'getDeliveryNote' ||
						operation === 'getReturnNote' ||
						operation === 'getTransferLabel'
					) {
						const packJobId = this.getNodeParameter('packJobId', i) as string;
						const outputField = this.getNodeParameter(
							'outputBinaryPropertyName',
							i,
							'data',
						) as string;
						const suffix = {
							getDeliveryNote: 'deliverynote',
							getReturnNote: 'returnnote',
							getTransferLabel: 'transferlabel',
						}[operation];
						const endpoint = `/api/packjobs/${encodeURIComponent(packJobId)}/${suffix}`;

						const { body, headers } = await fulfillmenttoolsApiRequestFile.call(this, endpoint);
						const fileName = resolveDownloadFileName(headers, `${suffix}-${packJobId}`);

						returnData.push({
							json: { packJobId, fileName },
							binary: {
								[outputField]: await this.helpers.prepareBinaryData(
									body,
									fileName,
									(headers['content-type'] as string)?.split(';')[0].trim(),
								),
							},
							pairedItem: { item: i },
						});
						continue;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'pickjob') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

						const qs: IDataObject = {};
						for (const key of [
							'searchTerm',
							'facilityRef',
							'orderRef',
							'tenantOrderId',
							'assignedUser',
							'consumerName',
							'channel',
							'startOrderDate',
							'endOrderDate',
							'startTargetTime',
							'endTargetTime',
						] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (Array.isArray(filters.status) && filters.status.length) qs.status = filters.status;

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								'/api/pickjobs',
								'pickjobs',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								'/api/pickjobs',
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.pickjobs as IDataObject[]) ?? []).slice(0, limit);
						}
					} else if (operation === 'create') {
						const body = buildPickJobForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/pickjobs',
							body,
						)) as IDataObject;
					} else if (operation === 'get') {
						const pickJobId = this.getNodeParameter('pickJobId', i) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/pickjobs/${encodeURIComponent(pickJobId)}`,
						)) as IDataObject;
					} else if (operation === 'getDeliveryNote') {
						const pickJobId = this.getNodeParameter('pickJobId', i) as string;
						const locale = this.getNodeParameter('locale', i, '') as string;
						const outputField = this.getNodeParameter(
							'outputBinaryPropertyName',
							i,
							'data',
						) as string;
						const endpoint = `/api/pickjobs/${encodeURIComponent(pickJobId)}/deliverynote${
							locale ? `?locale=${encodeURIComponent(locale)}` : ''
						}`;

						const { body, headers } = await fulfillmenttoolsApiRequestFile.call(this, endpoint);
						const fileName = resolveDownloadFileName(headers, `deliverynote-${pickJobId}`);

						returnData.push({
							json: { pickJobId, fileName },
							binary: {
								[outputField]: await this.helpers.prepareBinaryData(
									body,
									fileName,
									(headers['content-type'] as string)?.split(';')[0].trim(),
								),
							},
							pairedItem: { item: i },
						});
						continue;
					} else if (operation === 'getPickRun') {
						const pickRunId = this.getNodeParameter('pickRunId', i) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/pickruns/${encodeURIComponent(pickRunId)}`,
						)) as IDataObject;
					} else if (operation === 'createPickRun') {
						const body = buildPickRunForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							'/api/pickruns',
							body,
						)) as IDataObject;
					} else if (operation === 'updatePickRun') {
						const pickRunId = this.getNodeParameter('pickRunId', i) as string;
						const body = buildPickRunPatchAction(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PATCH',
							`/api/pickruns/${encodeURIComponent(pickRunId)}`,
							body,
						)) as IDataObject;
					} else if (operation === 'updatePickRunPickJobs') {
						const pickRunId = this.getNodeParameter('pickRunId', i) as string;
						const body = buildPickRunPickJobsPatchAction(this, i);
						const path = `/api/pickruns/${encodeURIComponent(pickRunId)}`;

						// PATCH returns no body; fetch the updated pick run to return it.
						await fulfillmenttoolsApiRequest.call(this, 'PATCH', `${path}/pickjobs`, body);
						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							path,
						)) as IDataObject;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'process') {
					if (operation === 'get') {
						const processId = this.getNodeParameter('processId', i, '', {
							extractValue: true,
						}) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/processes/${encodeURIComponent(processId)}`,
						)) as IDataObject;
					} else if (operation === 'getByReference') {
						const referenceType = this.getNodeParameter('referenceType', i) as string;
						const referenceValue = this.getNodeParameter('referenceValue', i) as string;

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							'/api/process',
							{},
							{ [referenceType]: referenceValue },
						)) as IDataObject;
					} else if (operation === 'getDocument') {
						const processId = this.getNodeParameter('processId', i, '', {
							extractValue: true,
						}) as string;
						const documentId = requireDocumentId(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'GET',
							`/api/processes/${encodeURIComponent(processId)}/documents/${encodeURIComponent(documentId)}`,
						)) as IDataObject;
					} else if (operation === 'createDocument') {
						const processId = this.getNodeParameter('processId', i, '', {
							extractValue: true,
						}) as string;
						const body = await buildExternalDocumentForCreation(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'POST',
							`/api/processes/${encodeURIComponent(processId)}/documents`,
							body,
						)) as IDataObject;
					} else if (operation === 'updateDocumentFile') {
						const processId = this.getNodeParameter('processId', i, '', {
							extractValue: true,
						}) as string;
						const documentId = requireDocumentId(this, i);
						const body = await buildExternalDocumentForUpdate(this, i);

						responseData = (await fulfillmenttoolsApiRequest.call(
							this,
							'PUT',
							`/api/processes/${encodeURIComponent(processId)}/documents/${encodeURIComponent(documentId)}/file`,
							body,
						)) as IDataObject;
					} else if (operation === 'downloadDocumentFile') {
						const documentId = requireDocumentId(this, i);
						const scope = this.getNodeParameter('downloadScope', i, 'process') as string;

						let endpoint: string;
						if (scope === 'document') {
							endpoint = `/api/documents/${encodeURIComponent(documentId)}/file`;
						} else {
							const processId = this.getNodeParameter('processId', i, '', {
								extractValue: true,
							}) as string;
							endpoint = `/api/processes/${encodeURIComponent(processId)}/documents/${encodeURIComponent(documentId)}/file`;
						}

						const { body, headers } = await fulfillmenttoolsApiRequestFile.call(this, endpoint);
						const fileName = resolveDownloadFileName(headers, documentId);
						const outputField = this.getNodeParameter(
							'outputBinaryPropertyName',
							i,
							'data',
						) as string;

						returnData.push({
							json: { documentId, fileName },
							binary: {
								[outputField]: await this.helpers.prepareBinaryData(
									body,
									fileName,
									(headers['content-type'] as string)?.split(';')[0].trim(),
								),
							},
							pairedItem: { item: i },
						});
						continue;
					} else if (operation === 'getHistoryLogs') {
						const processId = this.getNodeParameter('processId', i, '', {
							extractValue: true,
						}) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const filters = this.getNodeParameter('historyLogFilters', i, {}) as IDataObject;
						const endpoint = `/api/processes/${encodeURIComponent(processId)}/historylogs`;

						const qs: IDataObject = {};
						for (const key of ['type', 'username', 'facilityName', 'orderBy'] as const) {
							if (filters[key]) qs[key] = filters[key];
						}
						if (filters.filterConsecutiveDuplicates !== undefined) {
							qs.filterConsecutiveDuplicates = filters.filterConsecutiveDuplicates;
						}

						if (returnAll) {
							responseData = await fulfillmenttoolsApiRequestAllItems.call(
								this,
								endpoint,
								'historyLogs',
								qs,
							);
						} else {
							const limit = this.getNodeParameter('limit', i) as number;
							qs.size = limit;
							const response = (await fulfillmenttoolsApiRequest.call(
								this,
								'GET',
								endpoint,
								{},
								qs,
							)) as IDataObject;
							responseData = ((response.historyLogs as IDataObject[]) ?? []).slice(0, limit);
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for resource "${resource}"`,
							{ itemIndex: i },
						);
					}
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The resource "${resource}" is not supported`,
						{ itemIndex: i },
					);
				}

				if (
					[
						'get',
						'getAll',
						'search',
						'getByReference',
						'list',
						'getParcel',
						'listParcels',
						'searchParcels',
						'getShipment',
						'listShipments',
						'searchShipments',
						'listLinked',
						'getLinked',
						'searchLinked',
						'listJobs',
						'getJob',
						'listCustomServices',
						'getCustomService',
						'listFacilityCustomServices',
						'getFacilityCustomService',
						'listJobs',
						'listReturns',
						'getReturn',
						'findReturns',
					].includes(operation) &&
					(this.getNodeParameter('simplify', i, false) as boolean)
				) {
					const simplifiers: { [key: string]: (entity: IDataObject) => IDataObject } = {
						facility: simplifyFacility,
						order: simplifyOrder,
						carrier: simplifyCarrier,
						facilityCarrierConnection: simplifyFacilityCarrierConnection,
						inbound: simplifyInboundProcess,
						process: simplifyProcess,
						listing: simplifyListing,
						pickjob: simplifyPickJob,
						packjob: simplifyPackJob,
						handover: simplifyHandoverjob,
						routingplan: simplifyRoutingPlan,
					};
					// Some resources cover two entity types; pick the simplifier by operation.
					const parcelOps = ['getParcel', 'listParcels', 'searchParcels'];
					const serviceJobOps = ['listJobs', 'getJob'];
					let simplify: (entity: IDataObject) => IDataObject;
					if (resource === 'shipment') {
						simplify = parcelOps.includes(operation) ? simplifyParcel : simplifyShipment;
					} else if (resource === 'service') {
						const customServiceOps = ['listCustomServices', 'getCustomService'];
						const facilityCustomServiceOps = [
							'listFacilityCustomServices',
							'getFacilityCustomService',
						];
						if (serviceJobOps.includes(operation)) {
							simplify = simplifyServiceJob;
						} else if (customServiceOps.includes(operation)) {
							simplify = simplifyCustomService;
						} else if (facilityCustomServiceOps.includes(operation)) {
							simplify = simplifyFacilityCustomServiceConnection;
						} else {
							simplify = simplifyLinkedServiceJobs;
						}
					} else if (resource === 'return') {
						// listJobs here is "List Item Return Jobs"; the rest are item returns.
						simplify = operation === 'listJobs' ? simplifyItemReturnJob : simplifyItemReturn;
					} else {
						simplify = simplifiers[resource] ?? ((entity: IDataObject) => entity);
					}
					responseData = Array.isArray(responseData)
						? responseData.map((entity) => simplify(entity))
						: simplify(responseData);
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
