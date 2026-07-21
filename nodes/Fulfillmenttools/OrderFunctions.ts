import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

function splitCsv(value: unknown): string[] {
	return String(value)
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

/**
 * Build an `OrderForCreationConsumer` object from the "Consumer" collection.
 * Shared by the create and update builders (both use the same schema).
 */
function buildConsumer(
	ctx: IExecuteFunctions,
	itemIndex: number,
	input: IDataObject,
): IDataObject {
	const consumer: IDataObject = {};
	if (isSet(input.consumerId)) consumer.consumerId = input.consumerId;
	if (isSet(input.email)) consumer.email = input.email;
	if (isSet(input.facilityRef)) consumer.facilityRef = input.facilityRef;
	if (isSet(input.tenantFacilityId)) consumer.tenantFacilityId = input.tenantFacilityId;
	const addresses = parseJsonParam(ctx, itemIndex, input.addresses, 'Consumer Addresses');
	if (Array.isArray(addresses) && addresses.length) consumer.addresses = addresses;
	const custom = parseJsonParam(ctx, itemIndex, input.customAttributes, 'Consumer Custom Attributes');
	if (custom) consumer.customAttributes = custom;
	return consumer;
}

/**
 * Assemble an `OrderForCreation` request body from the node parameters.
 * Required by the API: orderDate, orderLineItems, consumer. Common fields are
 * exposed directly; anything deeper (deliveryPreferences, customServices, source,
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
		const item: IDataObject = { article, quantity: Number(line.quantity) };
		const lineCustom = parseJsonParam(
			ctx,
			itemIndex,
			line.customAttributes,
			'Line Item Custom Attributes',
		);
		if (lineCustom) item.customAttributes = lineCustom;
		if (isSet(line.scannableCodes)) item.scannableCodes = splitCsv(line.scannableCodes);
		return item;
	});

	const body: IDataObject = {
		orderDate: get('orderDate') as string,
		orderLineItems,
	};

	// consumer (order requires the object; subfields are optional)
	body.consumer = buildConsumer(ctx, itemIndex, get('consumer', {}) as IDataObject);

	// tags
	const tags = ((get('tags', {}) as IDataObject).tag as IDataObject[]) ?? [];
	if (tags.length) body.tags = tags.map((t) => ({ id: t.id, value: t.value }));

	// status reasons
	const statusReasons = ((get('statusReasons', {}) as IDataObject).reason as IDataObject[]) ?? [];
	if (statusReasons.length) {
		body.statusReasons = statusReasons.map((r) => ({ reason: r.reason, status: r.status }));
	}

	// payment info
	const paymentInput = get('paymentInfo', {}) as IDataObject;
	const paymentInfo: IDataObject = {};
	if (isSet(paymentInput.currency)) paymentInfo.currency = paymentInput.currency;
	const methodLocalized = parseJsonParam(
		ctx,
		itemIndex,
		paymentInput.methodLocalized,
		'Payment Method Localized',
	);
	if (methodLocalized && Object.keys(methodLocalized).length) {
		paymentInfo.methodLocalized = methodLocalized;
	}
	if (Object.keys(paymentInfo).length) body.paymentInfo = paymentInfo;

	// additional top-level fields
	const additionalFields = get('additionalFields', {}) as IDataObject;
	if (isSet(additionalFields.status)) body.status = additionalFields.status;
	if (isSet(additionalFields.tenantOrderId)) body.tenantOrderId = additionalFields.tenantOrderId;
	if (isSet(additionalFields.validUntil)) {
		body.promisesOptions = { validUntil: additionalFields.validUntil };
	}
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
 * locking); common fields come from "Update Fields", the consumer and order
 * line items are structured, and advanced fields (pricing) come from
 * "Additional Body Fields (JSON)".
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

	// consumer (structured, mirrors create)
	const consumer = buildConsumer(ctx, itemIndex, get('consumer', {}) as IDataObject);
	if (Object.keys(consumer).length) body.consumer = consumer;

	// order line items — the sent set REPLACES all existing line items
	const rawItems = ((get('updateOrderLineItems', {}) as IDataObject).item as IDataObject[]) ?? [];
	if (rawItems.length) {
		body.orderLineItems = rawItems.map((line) => {
			const item: IDataObject = {};
			if (isSet(line.id)) item.id = line.id;
			if (isSet(line.quantity)) item.quantity = Number(line.quantity);
			const article: IDataObject = {};
			if (isSet(line.tenantArticleId)) article.tenantArticleId = line.tenantArticleId;
			if (isSet(line.title)) article.title = line.title;
			if (Object.keys(article).length) item.article = article;
			return item;
		});
	}

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
