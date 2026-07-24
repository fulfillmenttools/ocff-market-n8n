import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';
import {
	buildArticle,
	buildConsumerAddress,
	buildLocaleString,
	buildRecordableAttributes,
	splitCsv,
} from './LineItemBuilders';

/** Reduce an item return job response to the most useful fields for "Simplify". */
export function simplifyItemReturnJob(job: IDataObject): IDataObject {
	return {
		id: job.id,
		shortId: job.shortId,
		status: job.status,
		originFacilityRefs: job.originFacilityRefs,
		tenantOrderId: job.tenantOrderId,
		created: job.created,
		lastModified: job.lastModified,
		version: job.version,
	};
}

/** Reduce an item return response to the most useful fields for "Simplify". */
export function simplifyItemReturn(itemReturn: IDataObject): IDataObject {
	return {
		id: itemReturn.id,
		status: itemReturn.status,
		returnFacilityRef: itemReturn.returnFacilityRef,
		tenantOrderId: itemReturn.tenantOrderId,
		created: itemReturn.created,
		lastModified: itemReturn.lastModified,
		version: itemReturn.version,
	};
}

/** Build an `ItemReturnJobLineItemForCreation` from one line-item entry. `delivered` is required. */
function buildJobLineItem(ctx: IExecuteFunctions, itemIndex: number, entry: IDataObject): IDataObject {
	const line: IDataObject = {
		article: buildArticle(ctx, itemIndex, entry, 'return job line item'),
		delivered: Number(entry.delivered),
	};
	if (isSet(entry.globalLineItemId)) line.globalLineItemId = entry.globalLineItemId;
	const scannableCodes = splitCsv(entry.scannableCodes);
	if (scannableCodes.length) line.scannableCodes = scannableCodes;
	const serviceJobRefs = splitCsv(entry.serviceJobRefs);
	if (serviceJobRefs.length) line.serviceJobRefs = serviceJobRefs;
	const recordableAttributes = buildRecordableAttributes(ctx, itemIndex, entry);
	if (recordableAttributes) line.recordableAttributes = recordableAttributes;
	const custom = parseJsonParam(ctx, itemIndex, entry.customAttributes, 'Custom Attributes');
	if (custom) line.customAttributes = custom;
	return line;
}

/** Build the `ItemReturnJobLineItemForCreation[]` for a fixedCollection under `key`, or undefined. */
function buildJobLineItems(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
	key: string,
): IDataObject[] | undefined {
	const entries = ((source[key] as IDataObject)?.item as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => buildJobLineItem(ctx, itemIndex, entry));
}

/** Build an `ItemReturnLineItemForCreation` from one returned-line-item entry. */
function buildReturnedLineItem(
	ctx: IExecuteFunctions,
	itemIndex: number,
	entry: IDataObject,
): IDataObject {
	if (!isSet(entry.itemReturnJobLineItemRef) || !isSet(entry.status)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`A returned line item is missing its 'Line Item Ref' or 'Status' [item ${itemIndex}]`,
			{ itemIndex, description: 'Every returned line item needs a line item ref and a status.' },
		);
	}
	const item: IDataObject = {
		itemReturnJobLineItemRef: entry.itemReturnJobLineItemRef,
		status: entry.status,
	};
	if (isSet(entry.tenantArticleId)) item.tenantArticleId = entry.tenantArticleId;
	if (isSet(entry.itemConditionComment)) item.itemConditionComment = entry.itemConditionComment;

	const itemConditionLocalized = buildLocaleString(entry.itemConditionLocalized);
	if (itemConditionLocalized) item.itemConditionLocalized = itemConditionLocalized;

	const reasonLocalized = buildLocaleString(entry.decisionReasonLocalized);
	if (reasonLocalized) {
		const decisionReason: IDataObject = { reasonLocalized };
		if (isSet(entry.decisionReasonComment)) decisionReason.comment = entry.decisionReasonComment;
		item.decisionReason = decisionReason;
	}

	const scannedCodes = splitCsv(entry.scannedCodes);
	if (scannedCodes.length) item.scannedCodes = scannedCodes;
	const recordableAttributes = buildRecordableAttributes(ctx, itemIndex, entry);
	if (recordableAttributes) item.recordableAttributes = recordableAttributes;
	const custom = parseJsonParam(ctx, itemIndex, entry.customAttributes, 'Custom Attributes');
	if (custom) item.customAttributes = custom;
	const reasons = parseJsonParam(ctx, itemIndex, entry.reasons, 'Reasons');
	if (reasons && Array.isArray(reasons)) item.reasons = reasons;
	return item;
}

/** Build the `ItemReturnLineItemForCreation[]` for a fixedCollection under `key`, or undefined. */
function buildReturnedLineItems(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
	key: string,
): IDataObject[] | undefined {
	const entries = ((source[key] as IDataObject)?.item as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => buildReturnedLineItem(ctx, itemIndex, entry));
}

/** Assemble an `ItemReturnJobForCreation` body for `POST /api/itemreturnjobs`. */
export function buildItemReturnJobForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const originFacilityRefs = splitCsv(get('originFacilityRefs'));
	if (!originFacilityRefs.length) {
		throw new NodeOperationError(ctx.getNode(), `No origin facility refs provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Enter one or more comma-separated references in 'Origin Facility Refs'.",
		});
	}

	const addressEntries = ((get('consumerAddresses', {}) as IDataObject).address as IDataObject[]) ?? [];
	const consumerAddresses = addressEntries
		.map((entry) => buildConsumerAddress(ctx, itemIndex, entry, 'Consumer Address'))
		.filter((address): address is IDataObject => address !== undefined);
	if (!consumerAddresses.length) {
		throw new NodeOperationError(ctx.getNode(), `No consumer addresses provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one address under 'Consumer Addresses'.",
		});
	}

	const returnableLineItems = buildJobLineItems(ctx, itemIndex, {
		returnableLineItems: get('returnableLineItems', {}) as IDataObject,
	}, 'returnableLineItems');
	if (!returnableLineItems) {
		throw new NodeOperationError(ctx.getNode(), `No returnable line items provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one line under 'Returnable Line Items'.",
		});
	}

	const body: IDataObject = {
		originFacilityRefs,
		status: get('status') as string,
		consumerAddresses,
		returnableLineItems,
	};

	const notReturnableLineItems = buildJobLineItems(ctx, itemIndex, {
		notReturnableLineItems: get('notReturnableLineItems', {}) as IDataObject,
	}, 'notReturnableLineItems');
	if (notReturnableLineItems) body.notReturnableLineItems = notReturnableLineItems;

	const add = get('additionalFields', {}) as IDataObject;
	for (const key of ['processRef', 'shortId', 'tenantOrderId'] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	const scannableCodes = splitCsv(add.scannableCodes);
	if (scannableCodes.length) body.scannableCodes = scannableCodes;
	const custom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/** Assemble an `AddItemReturnToItemReturnJob` body for `POST …/itemreturns`. */
export function buildAddItemReturn(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const returnedLineItems = buildReturnedLineItems(ctx, itemIndex, {
		returnedLineItems: get('returnedLineItems', {}) as IDataObject,
	}, 'returnedLineItems');
	if (!returnedLineItems) {
		throw new NodeOperationError(ctx.getNode(), `No returned line items provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one line under 'Returned Line Items'.",
		});
	}

	const itemReturnForCreation: IDataObject = {
		status: get('status') as string,
		returnFacilityRef: get('returnFacilityRef') as string,
		returnedLineItems,
	};
	const scannableCodes = splitCsv((get('additionalFields', {}) as IDataObject).scannableCodes);
	if (scannableCodes.length) itemReturnForCreation.scannableCodes = scannableCodes;

	return {
		itemReturnJobVersion: get('itemReturnJobVersion') as number,
		itemReturnForCreation,
	};
}

/** Assemble a `ReplaceReturnedLineItems` body for `PUT …/returnedlineitems`. */
export function buildReplaceReturnedLineItems(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const returnedLineItems = buildReturnedLineItems(ctx, itemIndex, {
		returnedLineItems: ctx.getNodeParameter('returnedLineItems', itemIndex, {}) as IDataObject,
	}, 'returnedLineItems');
	if (!returnedLineItems) {
		throw new NodeOperationError(ctx.getNode(), `No returned line items provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one line under 'Returned Line Items'.",
		});
	}
	return {
		itemReturnJobVersion: ctx.getNodeParameter('itemReturnJobVersion', itemIndex) as number,
		returnedLineItems,
	};
}

/** Assemble an `ItemReturnLineItemForUpdate` body for `PATCH …/returnedlineitems/{id}`. */
export function buildItemReturnLineItemForUpdate(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		itemReturnJobVersion: get('itemReturnJobVersion') as number,
	};

	const updateFields = get('updateFields', {}) as IDataObject;
	if (isSet(updateFields.status)) body.status = updateFields.status;

	const reasonLocalized = buildLocaleString(updateFields.decisionReasonLocalized);
	if (reasonLocalized) {
		const decisionReason: IDataObject = { reasonLocalized };
		if (isSet(updateFields.decisionReasonComment)) decisionReason.comment = updateFields.decisionReasonComment;
		body.decisionReason = decisionReason;
	}

	// Refund: either percent or a price {value, currency}, plus a required status.
	const refundStatus = updateFields.refundStatus as string | undefined;
	if (isSet(refundStatus)) {
		const refund: IDataObject = { status: refundStatus };
		if (isSet(updateFields.refundPercent)) {
			refund.percent = Number(updateFields.refundPercent);
		} else if (isSet(updateFields.refundValue)) {
			refund.price = {
				value: Number(updateFields.refundValue),
				currency: isSet(updateFields.refundCurrency) ? updateFields.refundCurrency : 'EUR',
			};
		}
		body.refund = refund;
	}

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}
