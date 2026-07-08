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
} from './GenericFunctions';
import { buildOrderForCreation, buildOrderForUpdate, simplifyOrder } from './OrderFunctions';
import { facilityFields, facilityOperations, orderFields, orderOperations } from './descriptions';

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
						name: 'Facility',
						value: 'facility',
					},
					{
						name: 'Order',
						value: 'order',
					},
				],
				default: 'facility',
			},

			// Facility
			...facilityOperations,
			...facilityFields,

			// Order
			...orderOperations,
			...orderFields,
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

				if (resource === 'facility') {
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
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The resource "${resource}" is not supported`,
						{ itemIndex: i },
					);
				}

				if (
					(operation === 'get' || operation === 'getAll') &&
					(this.getNodeParameter('simplify', i, false) as boolean)
				) {
					const simplify = resource === 'order' ? simplifyOrder : simplifyFacility;
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
