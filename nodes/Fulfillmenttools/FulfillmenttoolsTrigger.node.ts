import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { fulfillmenttoolsApiRequest } from './GenericFunctions';

// A trigger node has no execute() method and cannot be exposed as an AI tool,
// so the usable-as-tool rule does not apply here.
// eslint-disable-next-line @n8n/community-nodes/node-usable-as-tool
export class FulfillmenttoolsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'fulfillmenttools Trigger',
		name: 'fulfillmenttoolsTrigger',
		icon: { light: 'file:ftLogo.svg', dark: 'file:ftLogo.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when a fulfillmenttools event occurs',
		defaults: {
			name: 'fulfillmenttools Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'fulfillmenttoolsApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				required: true,
				default: 'ORDER_MODIFIED',
				description: 'The fulfillmenttools event to subscribe to',
				options: [
					{ name: 'Expiry Entity Created', value: 'EXPIRY_ENTITY_CREATED' },
					{ name: 'Expiry Entity Expired', value: 'EXPIRY_ENTITY_EXPIRED' },
					{ name: 'Expiry Entity Updated', value: 'EXPIRY_ENTITY_UPDATED' },
					{ name: 'External Action Executed', value: 'EXTERNAL_ACTION_EXECUTED' },
					{ name: 'Facility Created', value: 'FACILITY_CREATED' },
					{ name: 'Facility Deleted', value: 'FACILITY_DELETED' },
					{ name: 'Facility Group Created', value: 'FACILITY_GROUP_CREATED' },
					{ name: 'Facility Group Deleted', value: 'FACILITY_GROUP_DELETED' },
					{ name: 'Facility Group Updated', value: 'FACILITY_GROUP_UPDATED' },
					{ name: 'Facility Suspended', value: 'FACILITY_SUSPENDED' },
					{ name: 'Facility Updated', value: 'FACILITY_UPDATED' },
					{ name: 'Facility Went Offline', value: 'FACILITY_WENT_OFFLINE' },
					{ name: 'Facility Went Online', value: 'FACILITY_WENT_ONLINE' },
					{ name: 'Handoverjob Canceled', value: 'HANDOVERJOB_CANCELED' },
					{ name: 'Handoverjob Created', value: 'HANDOVERJOB_CREATED' },
					{ name: 'Handoverjob Handed Over', value: 'HANDOVERJOB_HANDED_OVER' },
					{ name: 'Handoverjob Reverted', value: 'HANDOVERJOB_REVERTED' },
					{ name: 'Inbound Delivery Finished', value: 'INBOUND_DELIVERY_FINISHED' },
					{ name: 'Inbound Delivery On Hold', value: 'INBOUND_DELIVERY_ON_HOLD' },
					{ name: 'Inbound Delivery Received', value: 'INBOUND_DELIVERY_RECEIVED' },
					{ name: 'Inbound Delivery Released', value: 'INBOUND_DELIVERY_RELEASED' },
					{ name: 'Inbound Process Purchase Order Canceled', value: 'INBOUND_PROCESS_PURCHASE_ORDER_CANCELED' },
					{ name: 'Inbound Process Purchase Order Created', value: 'INBOUND_PROCESS_PURCHASE_ORDER_CREATED' },
					{ name: 'Inbound Process Purchase Order Deleted', value: 'INBOUND_PROCESS_PURCHASE_ORDER_DELETED' },
					{ name: 'Inbound Process Purchase Order Line Items Changed', value: 'INBOUND_PROCESS_PURCHASE_ORDER_LINE_ITEMS_CHANGED' },
					{ name: 'Inbound Process Purchase Order Requested Date Changed', value: 'INBOUND_PROCESS_PURCHASE_ORDER_REQUESTED_DATE_CHANGED' },
					{ name: 'Inbound Process Receipt Created', value: 'INBOUND_PROCESS_RECEIPT_CREATED' },
					{ name: 'Inbound Process Receipt Line Item Changed', value: 'INBOUND_PROCESS_RECEIPT_LINE_ITEM_CHANGED' },
					{ name: 'Inbound Process Receipt Started', value: 'INBOUND_PROCESS_RECEIPT_STARTED' },
					{ name: 'Inventory Categories Created', value: 'INVENTORY_CATEGORIES_CREATED' },
					{ name: 'Inventory Categories Deleted', value: 'INVENTORY_CATEGORIES_DELETED' },
					{ name: 'Inventory Categories Information Changed', value: 'INVENTORY_CATEGORIES_INFORMATION_CHANGED' },
					{ name: 'Inventory Facility Stock Changed', value: 'INVENTORY_FACILITY_STOCK_CHANGED' },
					{ name: 'Inventory Reservations Created', value: 'INVENTORY_RESERVATIONS_CREATED' },
					{ name: 'Inventory Reservations Deleted', value: 'INVENTORY_RESERVATIONS_DELETED' },
					{ name: 'Inventory Stocks Created', value: 'INVENTORY_STOCKS_CREATED' },
					{ name: 'Inventory Stocks Deleted', value: 'INVENTORY_STOCKS_DELETED' },
					{ name: 'Inventory Stocks Location Changed', value: 'INVENTORY_STOCKS_LOCATION_CHANGED' },
					{ name: 'Inventory Stocks Value Changed', value: 'INVENTORY_STOCKS_VALUE_CHANGED' },
					{ name: 'Item Return Job Created', value: 'ITEM_RETURN_JOB_CREATED' },
					{ name: 'Item Return Job Updated', value: 'ITEM_RETURN_JOB_UPDATED' },
					{ name: 'Listings Created', value: 'LISTINGS_CREATED' },
					{ name: 'Listings Deleted', value: 'LISTINGS_DELETED' },
					{ name: 'Listings Information Changed', value: 'LISTINGS_INFORMATION_CHANGED' },
					{ name: 'Listings Status Changed', value: 'LISTINGS_STATUS_CHANGED' },
					{ name: 'Listings Stock Configurations Changed', value: 'LISTINGS_STOCK_CONFIGURATIONS_CHANGED' },
					{ name: 'Order Cancelled', value: 'ORDER_CANCELLED' },
					{ name: 'Order Cancelled By Expiry', value: 'ORDER_CANCELLED_BY_EXPIRY' },
					{ name: 'Order Created', value: 'ORDER_CREATED' },
					{ name: 'Order Force Cancelled', value: 'ORDER_FORCE_CANCELLED' },
					{ name: 'Order Modified', value: 'ORDER_MODIFIED' },
					{ name: 'Order Unlocked', value: 'ORDER_UNLOCKED' },
					{ name: 'Pack Job Canceled', value: 'PACK_JOB_CANCELED' },
					{ name: 'Pack Job Closed', value: 'PACK_JOB_CLOSED' },
					{ name: 'Pack Job Created', value: 'PACK_JOB_CREATED' },
					{ name: 'Pack Job Updated', value: 'PACK_JOB_UPDATED' },
					{ name: 'Packing Target Container Created Event', value: 'PACKING_TARGET_CONTAINER_CREATED_EVENT' },
					{ name: 'Packing Target Container Deleted Event', value: 'PACKING_TARGET_CONTAINER_DELETED_EVENT' },
					{ name: 'Packing Target Container Updated Event', value: 'PACKING_TARGET_CONTAINER_UPDATED_EVENT' },
					{ name: 'Parcel Carrier Acknowledged', value: 'PARCEL_CARRIER_ACKNOWLEDGED' },
					{ name: 'Parcel Carrier Created', value: 'PARCEL_CARRIER_CREATED' },
					{ name: 'Parcel Carrier Failed', value: 'PARCEL_CARRIER_FAILED' },
					{ name: 'Parcel Carrier Requested', value: 'PARCEL_CARRIER_REQUESTED' },
					{ name: 'Parcel Track And Trace Status Updated', value: 'PARCEL_TRACK_AND_TRACE_STATUS_UPDATED' },
					{ name: 'Pick Job Aborted', value: 'PICK_JOB_ABORTED' },
					{ name: 'Pick Job Canceled', value: 'PICK_JOB_CANCELED' },
					{ name: 'Pick Job Created', value: 'PICK_JOB_CREATED' },
					{ name: 'Pick Job Opened', value: 'PICK_JOB_OPENED' },
					{ name: 'Pick Job Pick Line Picked', value: 'PICK_JOB_PICK_LINE_PICKED' },
					{ name: 'Pick Job Picking Commenced', value: 'PICK_JOB_PICKING_COMMENCED' },
					{ name: 'Pick Job Picking Finished', value: 'PICK_JOB_PICKING_FINISHED' },
					{ name: 'Pick Job Picking Paused', value: 'PICK_JOB_PICKING_PAUSED' },
					{ name: 'Pick Job Rerouted', value: 'PICK_JOB_REROUTED' },
					{ name: 'Pick Job Reset', value: 'PICK_JOB_RESET' },
					{ name: 'Picking Pick Job Complete', value: 'PICKING_PICK_JOB_COMPLETE' },
					{ name: 'Process Anonymized', value: 'PROCESS_ANONYMIZED' },
					{ name: 'Process Deleted', value: 'PROCESS_DELETED' },
					{ name: 'Refund Triggered', value: 'REFUND_TRIGGERED' },
					{ name: 'Return Canceled', value: 'RETURN_CANCELED' },
					{ name: 'Return Claimed', value: 'RETURN_CLAIMED' },
					{ name: 'Return Closed', value: 'RETURN_CLOSED' },
					{ name: 'Return Created', value: 'RETURN_CREATED' },
					{ name: 'Return Updated', value: 'RETURN_UPDATED' },
					{ name: 'Routing Plan Cancelled', value: 'ROUTING_PLAN_CANCELLED' },
					{ name: 'Routing Plan Fallback', value: 'ROUTING_PLAN_FALLBACK' },
					{ name: 'Routing Plan Not Routable', value: 'ROUTING_PLAN_NOT_ROUTABLE' },
					{ name: 'Routing Plan Rerouteplan Created', value: 'ROUTING_PLAN_REROUTEPLAN_CREATED' },
					{ name: 'Routing Plan Routed', value: 'ROUTING_PLAN_ROUTED' },
					{ name: 'Routing Plan Splitted', value: 'ROUTING_PLAN_SPLITTED' },
					{ name: 'Routing Plan Waiting', value: 'ROUTING_PLAN_WAITING' },
					{ name: 'Service Job Created', value: 'SERVICE_JOB_CREATED' },
					{ name: 'Service Job Finished', value: 'SERVICE_JOB_FINISHED' },
					{ name: 'Shipment Created', value: 'SHIPMENT_CREATED' },
					{ name: 'Shipment Updated', value: 'SHIPMENT_UPDATED' },
					{ name: 'Storage Locations Created', value: 'STORAGE_LOCATIONS_CREATED' },
					{ name: 'Storage Locations Deleted', value: 'STORAGE_LOCATIONS_DELETED' },
					{ name: 'Storage Locations Information Changed', value: 'STORAGE_LOCATIONS_INFORMATION_CHANGED' },
					{ name: 'Stow Job Canceled', value: 'STOW_JOB_CANCELED' },
					{ name: 'Stow Job Closed', value: 'STOW_JOB_CLOSED' },
					{ name: 'Stow Job Commenced', value: 'STOW_JOB_COMMENCED' },
					{ name: 'Stow Job Created', value: 'STOW_JOB_CREATED' },
					{ name: 'Stow Job Line Items Stowed', value: 'STOW_JOB_LINE_ITEMS_STOWED' },
					{ name: 'Stow Job Opened', value: 'STOW_JOB_OPENED' },
					{ name: 'Stow Job Paused', value: 'STOW_JOB_PAUSED' },
					{ name: 'Upcoming Time Triggered Reroute', value: 'UPCOMING_TIME_TRIGGERED_REROUTE' },
					{ name: 'User Created', value: 'USER_CREATED' },
					{ name: 'User Deleted', value: 'USER_DELETED' },
					{ name: 'User Updated', value: 'USER_UPDATED' },
					{ name: 'Zone Created', value: 'ZONE_CREATED' },
					{ name: 'Zone Deleted', value: 'ZONE_DELETED' },
				],
			},
			{
				displayName: 'Subscription Name',
				name: 'subscriptionName',
				type: 'string',
				default: '',
				placeholder: 'n8n Order Modified',
				description:
					'Optional name for the subscription in fulfillmenttools. Defaults to "n8n &lt;event&gt;".',
			},
		],
	};

	webhookMethods = {
		default: {
			/**
			 * Look for an existing subscription in fulfillmenttools that already
			 * targets this workflow's webhook URL for the selected event.
			 */
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const staticData = this.getWorkflowStaticData('node');

				const response = (await fulfillmenttoolsApiRequest.call(
					this,
					'GET',
					'/api/subscriptions',
				)) as IDataObject;

				const subscriptions = (response.subscriptions as IDataObject[]) ?? [];
				for (const subscription of subscriptions) {
					const target = subscription.target as IDataObject | undefined;
					const callbackUrl =
						(target?.callbackUrl as string) ?? (subscription.callbackUrl as string);
					if (subscription.event === event && callbackUrl === webhookUrl) {
						staticData.subscriptionId = subscription.id;
						return true;
					}
				}
				return false;
			},

			/**
			 * Register a new WEBHOOK subscription pointing at this workflow's URL.
			 */
			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const nameParam = this.getNodeParameter('subscriptionName', '') as string;

				const body: IDataObject = {
					name: nameParam || `n8n ${event}`,
					event,
					target: {
						type: 'WEBHOOK',
						callbackUrl: webhookUrl,
					},
				};

				const response = (await fulfillmenttoolsApiRequest.call(
					this,
					'POST',
					'/api/subscriptions',
					body,
				)) as IDataObject;

				if (!response.id) {
					return false;
				}

				const staticData = this.getWorkflowStaticData('node');
				staticData.subscriptionId = response.id;
				return true;
			},

			/**
			 * Remove the subscription when the workflow is deactivated.
			 */
			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				const subscriptionId = staticData.subscriptionId as string | undefined;

				if (subscriptionId) {
					try {
						await fulfillmenttoolsApiRequest.call(
							this,
							'DELETE',
							`/api/subscriptions/${encodeURIComponent(subscriptionId)}`,
						);
					} catch {
						return false;
					}
					delete staticData.subscriptionId;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();
		return {
			workflowData: [this.helpers.returnJsonArray(body as IDataObject)],
		};
	}
}
