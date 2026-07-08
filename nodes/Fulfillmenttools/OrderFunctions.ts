import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

/**
 * Assemble an `OrderForCreation` request body from the node parameters.
 * Required by the API: orderDate, orderLineItems, consumer. Common fields are
 * exposed directly; anything deeper (deliveryPreferences, paymentInfo, source,
 * stickers, …) can be supplied via the "Additional Body Fields (JSON)" param.
 */
export function buildOrderForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const rawItems = ((get('orderLineItems', {}) as IDataObject).item as IDataObject[]) ?? [];
	const orderLineItems = rawItems.map((line) => {
		const article: IDataObject = {
			tenantArticleId: line.tenantArticleId,
			title: line.title,
		};
		if (isSet(line.imageUrl)) article.imageUrl = line.imageUrl;
		return { article, quantity: Number(line.quantity) } as IDataObject;
	});

	const body: IDataObject = {
		orderDate: get('orderDate') as string,
		orderLineItems,
	};

	const tenantOrderId = get('tenantOrderId', '') as string;
	if (isSet(tenantOrderId)) body.tenantOrderId = tenantOrderId;

	// consumer (order requires the object; subfields are optional)
	const consumerInput = get('consumer', {}) as IDataObject;
	const consumer: IDataObject = {};
	if (isSet(consumerInput.consumerId)) consumer.consumerId = consumerInput.consumerId;
	if (isSet(consumerInput.email)) consumer.email = consumerInput.email;
	const addresses = parseJsonParam(ctx, itemIndex, consumerInput.addresses, 'Consumer Addresses');
	if (Array.isArray(addresses) && addresses.length) consumer.addresses = addresses;
	body.consumer = consumer;

	// additional top-level fields
	const additionalFields = get('additionalFields', {}) as IDataObject;
	if (isSet(additionalFields.status)) body.status = additionalFields.status;
	const customAttributes = parseJsonParam(
		ctx,
		itemIndex,
		additionalFields.customAttributes,
		'Custom Attributes',
	);
	if (customAttributes) body.customAttributes = customAttributes;

	// raw escape hatch
	const advanced = parseJsonParam(
		ctx,
		itemIndex,
		get('additionalBodyFields', '{}'),
		'Additional Body Fields',
	);
	if (advanced) Object.assign(body, advanced);

	return body;
}

/**
 * Assemble an `OrderForUpdate` PATCH body. `version` is required (optimistic
 * locking); common fields come from "Update Fields" and advanced fields
 * (consumer, orderLineItems, pricing) from "Additional Body Fields (JSON)".
 */
export function buildOrderForUpdate(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		version: get('version') as number,
	};

	const updateFields = get('updateFields', {}) as IDataObject;
	if (isSet(updateFields.comment)) body.comment = updateFields.comment;
	if (isSet(updateFields.preferredHandlingTime)) {
		body.preferredHandlingTime = updateFields.preferredHandlingTime;
	}
	const customAttributes = parseJsonParam(
		ctx,
		itemIndex,
		updateFields.customAttributes,
		'Custom Attributes',
	);
	if (customAttributes) body.customAttributes = customAttributes;

	const advanced = parseJsonParam(
		ctx,
		itemIndex,
		get('additionalBodyFields', '{}'),
		'Additional Body Fields',
	);
	if (advanced) Object.assign(body, advanced);

	return body;
}

/**
 * Reduce an order response to a small set of the most useful fields, for the
 * node's "Simplify" option.
 */
export function simplifyOrder(order: IDataObject): IDataObject {
	const consumer = (order.consumer as IDataObject) ?? {};
	const lineItems = (order.orderLineItems as IDataObject[]) ?? [];
	return {
		id: order.id,
		tenantOrderId: order.tenantOrderId,
		status: order.status,
		orderDate: order.orderDate,
		created: order.created,
		version: order.version,
		consumer: {
			consumerId: consumer.consumerId,
			email: consumer.email,
		},
		orderLineItems: lineItems.map((line) => {
			const article = (line.article as IDataObject) ?? {};
			return {
				tenantArticleId: article.tenantArticleId,
				title: article.title,
				quantity: line.quantity,
			};
		}),
	};
}
