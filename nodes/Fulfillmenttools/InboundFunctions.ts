import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

function splitCsv(value: unknown): string[] {
	return String(value)
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

function buildQuantity(value: unknown, unit: unknown): IDataObject {
	const quantity: IDataObject = { value: Number(value) };
	if (isSet(unit)) quantity.unit = unit as string;
	return quantity;
}

function commentsFrom(content: unknown): IDataObject[] {
	return isSet(content) ? [{ content: content as string }] : [];
}

/** Return the object only if it has at least one key, else undefined. */
function nonEmpty(obj: IDataObject | undefined): IDataObject | undefined {
	return obj && Object.keys(obj).length > 0 ? obj : undefined;
}

/**
 * Assemble the optional `purchaseOrder` object of an inbound process. Returns
 * undefined when the user provided nothing. Throws if partially filled (the API
 * requires orderDate, requestedDate and at least one line item).
 */
export function buildPurchaseOrder(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject | undefined {
	const po = ctx.getNodeParameter('purchaseOrder', itemIndex, {}) as IDataObject;
	const lineItemsInput =
		((ctx.getNodeParameter('purchaseOrderLineItems', itemIndex, {}) as IDataObject)
			.item as IDataObject[]) ?? [];

	if (Object.keys(po).length === 0 && lineItemsInput.length === 0) return undefined;

	const requestedItems = lineItemsInput.map((line) => {
		const item: IDataObject = {
			tenantArticleId: line.tenantArticleId,
			quantity: buildQuantity(line.quantity, line.quantityUnit),
		};
		const customAttributes = nonEmpty(
			parseJsonParam(ctx, itemIndex, line.customAttributes, 'Purchase Order Line Item Custom Attributes'),
		);
		if (customAttributes) item.customAttributes = customAttributes;
		const stockProperties = nonEmpty(
			parseJsonParam(ctx, itemIndex, line.stockProperties, 'Purchase Order Line Item Stock Properties'),
		);
		if (stockProperties) item.stockProperties = stockProperties;
		return item;
	});

	if (!isSet(po.orderDate) || requestedItems.length === 0) {
		throw new NodeOperationError(
			ctx.getNode(),
			'A purchase order requires an Order Date and at least one Purchase Order Line Item',
			{ itemIndex },
		);
	}

	const requestedDateType = (po.requestedDateType as string) || 'TIME_POINT';
	if (requestedDateType === 'TIME_POINT' && !isSet(po.requestedDate)) {
		throw new NodeOperationError(
			ctx.getNode(),
			'A purchase order requires a Requested Date when Requested Date Type is Time Point',
			{ itemIndex },
		);
	}
	const requestedDate: IDataObject = { type: requestedDateType };
	if (requestedDateType === 'TIME_POINT') requestedDate.value = po.requestedDate;

	const purchaseOrder: IDataObject = {
		orderDate: po.orderDate,
		requestedDate,
		requestedItems,
	};
	if (isSet(po.status)) purchaseOrder.status = po.status;
	if (isSet(po.supplierName)) purchaseOrder.supplier = { name: po.supplierName };
	const customAttributes = parseJsonParam(
		ctx,
		itemIndex,
		po.customAttributes,
		'Purchase Order Custom Attributes',
	);
	if (customAttributes) purchaseOrder.customAttributes = customAttributes;

	return purchaseOrder;
}

/**
 * Assemble a single `receipt` object. Returns undefined when the user provided
 * nothing. Shared by Create (inline receipt) and the Add Receipt operation.
 */
export function buildReceipt(ctx: IExecuteFunctions, itemIndex: number): IDataObject | undefined {
	const receiptInput = ctx.getNodeParameter('receipt', itemIndex, {}) as IDataObject;
	const receivedItemsInput =
		((ctx.getNodeParameter('receivedItems', itemIndex, {}) as IDataObject).item as IDataObject[]) ??
		[];

	if (Object.keys(receiptInput).length === 0 && receivedItemsInput.length === 0) return undefined;

	const receivedItems = receivedItemsInput.map((received) => {
		const item: IDataObject = {
			tenantArticleId: received.tenantArticleId,
			acceptedQuantity: buildQuantity(received.acceptedQuantity, received.acceptedQuantityUnit),
			rejectedQuantity: buildQuantity(received.rejectedQuantity, received.rejectedQuantityUnit),
			comments: commentsFrom(received.comment),
		};
		if (isSet(received.storageLocationRef)) item.storageLocationRef = received.storageLocationRef;
		const stockProperties = nonEmpty(
			parseJsonParam(ctx, itemIndex, received.stockProperties, 'Received Item Stock Properties'),
		);
		if (stockProperties) item.stockProperties = stockProperties;
		return item;
	});

	if (!isSet(receiptInput.receivedDate) || receivedItems.length === 0) {
		throw new NodeOperationError(
			ctx.getNode(),
			'A receipt requires a Received Date and at least one Received Item',
			{ itemIndex },
		);
	}

	const receipt: IDataObject = {
		receivedDate: receiptInput.receivedDate,
		receivedItems,
		comments: commentsFrom(receiptInput.comment),
	};
	if (isSet(receiptInput.status)) receipt.status = receiptInput.status;
	if (isSet(receiptInput.asnRef)) receipt.asnRef = receiptInput.asnRef;
	const customAttributes = parseJsonParam(
		ctx,
		itemIndex,
		receiptInput.customAttributes,
		'Receipt Custom Attributes',
	);
	if (customAttributes) receipt.customAttributes = customAttributes;

	return receipt;
}

/**
 * Body for the Add Receipt operation (`InboundReceiptForCreation`). Reuses
 * buildReceipt and merges its own "Additional Body Fields (JSON)".
 */
export function buildInboundReceiptForCreation(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const receipt = buildReceipt(ctx, itemIndex);
	if (!receipt) {
		throw new NodeOperationError(
			ctx.getNode(),
			'A receipt requires a Received Date and at least one Received Item',
			{ itemIndex },
		);
	}
	const advanced = parseJsonParam(
		ctx,
		itemIndex,
		ctx.getNodeParameter('additionalBodyFields', itemIndex, '{}'),
		'Additional Body Fields',
	);
	if (advanced) Object.assign(receipt, advanced);
	return receipt;
}

/**
 * Assemble an `InboundProcessForCreation` request body. Required by the API:
 * facilityRef. Common fields are exposed directly; the deeper objects
 * (purchaseOrder, receipts) can be supplied via "Additional Body Fields (JSON)".
 */
export function buildInboundProcessForCreation(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		facilityRef: ctx.getNodeParameter('facilityRef', itemIndex, '', {
			extractValue: true,
		}) as string,
	};

	const additionalFields = get('additionalFields', {}) as IDataObject;
	if (isSet(additionalFields.tenantInboundProcessId)) {
		body.tenantInboundProcessId = additionalFields.tenantInboundProcessId;
	}
	if (additionalFields.onHold !== undefined) body.onHold = additionalFields.onHold;
	if (isSet(additionalFields.scannableCodes)) {
		body.scannableCodes = splitCsv(additionalFields.scannableCodes);
	}
	const customAttributes = parseJsonParam(
		ctx,
		itemIndex,
		additionalFields.customAttributes,
		'Custom Attributes',
	);
	if (customAttributes) body.customAttributes = customAttributes;

	const purchaseOrder = buildPurchaseOrder(ctx, itemIndex);
	if (purchaseOrder) body.purchaseOrder = purchaseOrder;

	const receipt = buildReceipt(ctx, itemIndex);
	if (receipt) body.receipts = [receipt];

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
 * Assemble an `InboundProcessForPatch` body. `version` is required (optimistic
 * locking).
 */
export function buildInboundProcessForPatch(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		version: get('version') as number,
	};

	const updateFields = get('updateFields', {}) as IDataObject;
	if (updateFields.onHold !== undefined) body.onHold = updateFields.onHold;
	if (isSet(updateFields.scannableCodes)) {
		body.scannableCodes = splitCsv(updateFields.scannableCodes);
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
 * Reduce an inbound process response to a small set of the most useful fields,
 * for the node's "Simplify" option.
 */
export function simplifyInboundProcess(process: IDataObject): IDataObject {
	return {
		id: process.id,
		tenantInboundProcessId: process.tenantInboundProcessId,
		facilityRef: process.facilityRef,
		status: process.status,
		onHold: process.onHold,
		inboundDate: process.inboundDate,
		version: process.version,
		created: process.created,
		lastModified: process.lastModified,
	};
}
