import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';
import {
	buildArticle,
	buildAssignedUsers,
	buildConsumerAddress,
	buildRecordableAttributes,
	buildTags,
	buildTransfers,
	buildWorkflowInformation,
	splitCsv,
} from './LineItemBuilders';

/**
 * Reduce a handover job response to the most useful fields, for the node's
 * "Simplify" option (a Handoverjob carries far more than 10 fields).
 */
export function simplifyHandoverjob(handover: IDataObject): IDataObject {
	return {
		id: handover.id,
		shortIdentifier: handover.shortIdentifier,
		status: handover.status,
		channel: handover.channel,
		facilityRef: handover.facilityRef,
		pickJobRef: handover.pickJobRef,
		tenantOrderId: handover.tenantOrderId,
		targetTime: handover.targetTime,
		created: handover.created,
		lastModified: handover.lastModified,
		version: handover.version,
	};
}

/** Common fields shared by every handover line-item variant (article, quantity, codes, tags…). */
function baseLineItem(
	ctx: IExecuteFunctions,
	itemIndex: number,
	entry: IDataObject,
): IDataObject {
	const line: IDataObject = {
		article: buildArticle(ctx, itemIndex, entry, 'handover line item'),
		quantity: Number(entry.quantity),
	};
	for (const key of ['measurementUnitKey', 'secondaryMeasurementUnitKey', 'globalLineItemId'] as const) {
		if (isSet(entry[key])) line[key] = entry[key];
	}
	if (isSet(entry.secondaryQuantity)) line.secondaryQuantity = Number(entry.secondaryQuantity);

	const scannableCodes = splitCsv(entry.scannableCodes);
	if (scannableCodes.length) line.scannableCodes = scannableCodes;

	const tags = buildTags(entry);
	if (tags) line.tags = tags;
	const recordableAttributes = buildRecordableAttributes(ctx, itemIndex, entry);
	if (recordableAttributes) line.recordableAttributes = recordableAttributes;

	const custom = parseJsonParam(ctx, itemIndex, entry.customAttributes, 'Custom Attributes');
	if (custom) line.customAttributes = custom;
	const stickers = parseJsonParam(ctx, itemIndex, entry.stickers, 'Stickers');
	if (stickers) line.stickers = stickers;
	const advanced = parseJsonParam(ctx, itemIndex, entry.additionalFields, 'Additional Fields');
	if (advanced) Object.assign(line, advanced);
	return line;
}

/** Build the `handoverJobLineItems` array. `handedOverQuantity` is required here. */
function buildHandoverLineItems(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries = ((source.handoverJobLineItems as IDataObject)?.item as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => {
		const line = baseLineItem(ctx, itemIndex, entry);
		line.handedOverQuantity = Number(entry.handedOverQuantity);
		if (isSet(entry.status)) line.status = entry.status;
		const refused = parseJsonParam(ctx, itemIndex, entry.refused, 'Refused');
		if (refused) line.refused = refused;
		const substitutes = parseJsonParam(ctx, itemIndex, entry.substituteLineItems, 'Substitute Line Items');
		if (substitutes) line.substituteLineItems = substitutes;
		return line;
	});
}

/** Build the `expectedHandoverJobLineItems` array. */
function buildExpectedLineItems(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries =
		((source.expectedHandoverJobLineItems as IDataObject)?.item as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => {
		const line = baseLineItem(ctx, itemIndex, entry);
		if (isSet(entry.transferId)) line.transferId = entry.transferId;
		return line;
	});
}

/** Build the `missingHandoverJobLineItems` array. */
function buildMissingLineItems(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries =
		((source.missingHandoverJobLineItems as IDataObject)?.item as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => baseLineItem(ctx, itemIndex, entry));
}

/** Build the `handoverJobParcelInfo` object from its collection, or undefined if empty. */
function buildParcelInfo(source: IDataObject): IDataObject | undefined {
	const info: IDataObject = {};
	for (const key of [
		'carrierRef',
		'carrierParcelRef',
		'carrierTrackingNumber',
		'carrierLogoUrl',
		'parcelRef',
		'shipmentRef',
	] as const) {
		if (isSet(source[key])) info[key] = source[key];
	}
	return Object.keys(info).length ? info : undefined;
}

/**
 * Assemble a `HandoverjobForCreation` body for `POST /api/handoverjobs`.
 * `facilityRef`, `targetTime`, `channel` and `orderDate` are required.
 */
export function buildHandoverjobForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		// The Facility is a resourceLocator, so its value needs extractValue.
		facilityRef: ctx.getNodeParameter('facilityRef', itemIndex, '', {
			extractValue: true,
		}) as string,
		targetTime: get('targetTime') as string,
		channel: get('channel') as string,
		orderDate: get('orderDate') as string,
	};

	const handoverLineItems = buildHandoverLineItems(ctx, itemIndex, {
		handoverJobLineItems: get('handoverJobLineItems', {}) as IDataObject,
	});
	if (handoverLineItems) body.handoverJobLineItems = handoverLineItems;
	const expectedLineItems = buildExpectedLineItems(ctx, itemIndex, {
		expectedHandoverJobLineItems: get('expectedHandoverJobLineItems', {}) as IDataObject,
	});
	if (expectedLineItems) body.expectedHandoverJobLineItems = expectedLineItems;
	const missingLineItems = buildMissingLineItems(ctx, itemIndex, {
		missingHandoverJobLineItems: get('missingHandoverJobLineItems', {}) as IDataObject,
	});
	if (missingLineItems) body.missingHandoverJobLineItems = missingLineItems;

	const add = get('additionalFields', {}) as IDataObject;
	for (const key of [
		'fullIdentifier',
		'shortIdentifier',
		'tenantOrderId',
		'pickJobRef',
		'routingPlanRef',
		'processId',
		'operativeProcessRef',
		'status',
		'cancelReason',
	] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	if (add.paid !== undefined && add.paid !== '') body.paid = add.paid;
	const custom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	// ----- structured collections -----
	const tags = buildTags({ tags: get('handoverTags', {}) as IDataObject });
	if (tags?.length) body.tags = tags;

	const assignedUsers = buildAssignedUsers({ assignedUsers: get('assignedUsers', {}) as IDataObject });
	if (assignedUsers?.length) body.assignedUsers = assignedUsers;

	const transfers = buildTransfers({ transfers: get('transfers', {}) as IDataObject });
	if (transfers?.length) body.transfers = transfers;

	const invoiceAddress = buildConsumerAddress(
		ctx,
		itemIndex,
		get('invoiceAddress', {}) as IDataObject,
		'Invoice Address',
	);
	if (invoiceAddress) body.invoiceAddress = invoiceAddress;
	const recipientAddress = buildConsumerAddress(
		ctx,
		itemIndex,
		get('recipientAddress', {}) as IDataObject,
		'Recipient Address',
	);
	if (recipientAddress) body.recipientAddress = recipientAddress;

	const parcelInfo = buildParcelInfo(get('handoverJobParcelInfo', {}) as IDataObject);
	if (parcelInfo) body.handoverJobParcelInfo = parcelInfo;

	const workflowInformation = buildWorkflowInformation(get('workflowInformation', {}) as IDataObject);
	if (workflowInformation) body.workflowInformation = workflowInformation;

	const stickers = parseJsonParam(ctx, itemIndex, get('stickers', undefined), 'Stickers');
	if (stickers && Array.isArray(stickers)) body.stickers = stickers;

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/**
 * Assemble a `HandoverjobPatchActions` body for
 * `PATCH /api/handoverjobs/{handoverjobId}`. The only non-deprecated action is
 * `ModifyHandoverjob` (status / custom attributes); extra raw actions can be
 * appended via the JSON escape hatch.
 */
export function buildHandoverjobPatchActions(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const updateFields = ctx.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const actions: IDataObject[] = [];
	const modify: IDataObject = { action: 'ModifyHandoverjob' };
	if (isSet(updateFields.status)) modify.status = updateFields.status;
	const custom = parseJsonParam(ctx, itemIndex, updateFields.customAttributes, 'Custom Attributes');
	if (custom) modify.customAttributes = custom;
	if (Object.keys(modify).length > 1) actions.push(modify);

	const extraActions = parseJsonParam(
		ctx,
		itemIndex,
		ctx.getNodeParameter('additionalActions', itemIndex, '[]'),
		'Additional Actions',
	);
	if (extraActions && Array.isArray(extraActions)) actions.push(...(extraActions as IDataObject[]));

	if (!actions.length) {
		throw new NodeOperationError(ctx.getNode(), `No actions to apply [item ${itemIndex}]`, {
			itemIndex,
			description: "Set a field under 'Update Fields' or add a raw action.",
		});
	}

	return {
		version: ctx.getNodeParameter('version', itemIndex) as number,
		actions,
	};
}
