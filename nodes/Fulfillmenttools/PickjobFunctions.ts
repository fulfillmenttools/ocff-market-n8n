import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';
import {
	buildArticleAttributes,
	buildAssignedUsers,
	buildLocaleString,
	buildRecordableAttributes,
	buildTags,
	buildTransfers,
	splitCsv as splitList,
} from './LineItemBuilders';

/**
 * Reduce a pick job response to the most useful fields, for the node's "Simplify"
 * option (a PickJob carries far more than 10 fields).
 */
export function simplifyPickJob(pickJob: IDataObject): IDataObject {
	return {
		id: pickJob.id,
		shortId: pickJob.shortId,
		status: pickJob.status,
		facilityRef: pickJob.facilityRef,
		orderRef: pickJob.orderRef,
		tenantOrderId: pickJob.tenantOrderId,
		targetTime: pickJob.targetTime,
		created: pickJob.created,
		lastModified: pickJob.lastModified,
		version: pickJob.version,
	};
}

/** Assemble a single `PickLineItemForCreation` from one Pick Line Items entry. */
function buildPickLineItem(
	ctx: IExecuteFunctions,
	itemIndex: number,
	entry: IDataObject,
): IDataObject {
	if (!isSet(entry.tenantArticleId) || !isSet(entry.title)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`A pick line item is missing its article 'Tenant Article ID' or 'Title' [item ${itemIndex}]`,
			{ itemIndex, description: 'Every pick line item needs an article tenant ID and title.' },
		);
	}

	const article: IDataObject = { tenantArticleId: entry.tenantArticleId, title: entry.title };
	if (isSet(entry.imageUrl)) article.imageUrl = entry.imageUrl;
	if (isSet(entry.weight)) article.weight = Number(entry.weight);
	const titleLocalized = buildLocaleString(entry.titleLocalized);
	if (titleLocalized) article.titleLocalized = titleLocalized;
	const attributes = buildArticleAttributes(ctx, itemIndex, entry);
	if (attributes) article.attributes = attributes;

	const line: IDataObject = { article, quantity: Number(entry.quantity) };
	for (const key of ['measurementUnitKey', 'secondaryMeasurementUnitKey', 'globalLineItemId'] as const) {
		if (isSet(entry[key])) line[key] = entry[key];
	}
	if (isSet(entry.secondaryQuantity)) line.secondaryQuantity = Number(entry.secondaryQuantity);

	const scannableCodes = splitList(entry.scannableCodes);
	if (scannableCodes.length) line.scannableCodes = scannableCodes;

	const tags = buildTags(entry);
	if (tags) line.tags = tags;
	const recordableAttributes = buildRecordableAttributes(ctx, itemIndex, entry);
	if (recordableAttributes) line.recordableAttributes = recordableAttributes;

	const lineCustom = parseJsonParam(ctx, itemIndex, entry.customAttributes, 'Custom Attributes');
	if (lineCustom) line.customAttributes = lineCustom;

	// Deep, less-common structures are provided as raw JSON per line.
	for (const [param, key] of [
		['allowedSubstitutes', 'allowedSubstitutes'],
		['partialStockLocations', 'partialStockLocations'],
		['measurementValidation', 'measurementValidation'],
		['stickers', 'stickers'],
	] as const) {
		const value = parseJsonParam(ctx, itemIndex, entry[param], param);
		if (value) line[key] = value;
	}

	const lineAdvanced = parseJsonParam(ctx, itemIndex, entry.additionalFields, 'Additional Fields');
	if (lineAdvanced) Object.assign(line, lineAdvanced);
	return line;
}

/**
 * Assemble a `PickJobForCreation` body for `POST /api/pickjobs`. `orderDate`,
 * `facilityRef` and at least one pick line item are required.
 */
export function buildPickJobForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const lineEntries = ((get('pickLineItems', {}) as IDataObject).item as IDataObject[]) ?? [];
	if (!lineEntries.length) {
		throw new NodeOperationError(ctx.getNode(), `No pick line items provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one line under 'Pick Line Items'.",
		});
	}

	const body: IDataObject = {
		orderDate: get('orderDate') as string,
		// The Facility is a resourceLocator, so its value needs extractValue.
		facilityRef: ctx.getNodeParameter('facilityRef', itemIndex, '', {
			extractValue: true,
		}) as string,
		pickLineItems: lineEntries.map((entry) => buildPickLineItem(ctx, itemIndex, entry)),
	};

	const add = get('additionalFields', {}) as IDataObject;
	for (const key of [
		'orderRef',
		'tenantOrderId',
		'shortId',
		'status',
		'processId',
		'routingPlanRef',
		'operativeProcessRef',
	] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	const methods = (add.preferredPickingMethods as string[]) ?? [];
	if (methods.length) body.preferredPickingMethods = methods;
	if (isSet(add.paymentCurrency)) {
		body.paymentInformation = { currency: add.paymentCurrency } as IDataObject;
	}
	if (isSet(add.startLatestAt)) {
		body.pickingTimes = { startLatestAt: add.startLatestAt } as IDataObject;
	}

	const custom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	// ----- structured collections -----
	const topTags = buildTags({ tags: get('pickJobTags', {}) as IDataObject });
	if (topTags?.length) body.tags = topTags;

	const assignedUsers = buildAssignedUsers({ assignedUsers: get('assignedUsers', {}) as IDataObject });
	if (assignedUsers?.length) body.assignedUsers = assignedUsers;

	const transfers = buildTransfers({ transfers: get('transfers', {}) as IDataObject });
	if (transfers?.length) body.transfers = transfers;

	// ----- deep structures as dedicated JSON fields -----
	for (const [param, key] of [
		['deliveryInformation', 'deliveryinformation'],
		['stickers', 'stickers'],
		['expectedPickLineItems', 'expectedPickLineItems'],
		['workflowInformation', 'workflowInformation'],
	] as const) {
		const value = parseJsonParam(ctx, itemIndex, get(param, undefined), param);
		if (value) body[key] = value;
	}

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/**
 * Assemble a `PickRunForCreation` body for `POST /api/pickruns`. `facilityRef`
 * and at least one pick job reference are required.
 */
export function buildPickRunForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const facilityRef = ctx.getNodeParameter('facilityRef', itemIndex, '', {
		extractValue: true,
	}) as string;

	const pickJobRefs = splitList(ctx.getNodeParameter('pickJobRefs', itemIndex, '') as string);
	if (!pickJobRefs.length) {
		throw new NodeOperationError(ctx.getNode(), `No pick job references provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Enter one or more comma-separated references in 'Pick Job Refs'.",
		});
	}

	const body: IDataObject = { facilityRef, pickJobRefs };

	const add = ctx.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
	if (isSet(add.pickRunType)) body.pickRunType = add.pickRunType;
	if (isSet(add.status)) body.status = add.status;

	return body;
}

/**
 * Assemble a `PickRunPatchAction` body for `PATCH /api/pickruns/{pickRunId}`. The
 * line-item modifications become `ModifyPickRunLineItem` actions; extra raw
 * actions can be appended via the JSON escape hatch.
 */
export function buildPickRunPatchAction(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const modifications =
		((ctx.getNodeParameter('lineItemModifications', itemIndex, {}) as IDataObject)
			.modification as IDataObject[]) ?? [];

	const actions: IDataObject[] = modifications.map((mod) => {
		if (!isSet(mod.id)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`A line item modification is missing its 'Line Item ID' [item ${itemIndex}]`,
				{ itemIndex, description: 'Every modification needs the ID of the pick line item.' },
			);
		}
		const action: IDataObject = { action: 'ModifyPickRunLineItem', id: mod.id };
		if (isSet(mod.picked)) action.picked = Number(mod.picked);
		if (isSet(mod.secondaryPicked)) action.secondaryPicked = Number(mod.secondaryPicked);
		if (isSet(mod.status)) action.status = mod.status;
		return action;
	});

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
			description: "Add at least one line item modification or a raw action.",
		});
	}

	return {
		version: ctx.getNodeParameter('version', itemIndex) as number,
		actions,
	};
}

/**
 * Assemble a `PickRunPickJobsPatchAction` body for
 * `PATCH /api/pickruns/{pickRunId}/pickjobs` — a single `RemovePickJobFromPickRun`
 * action removing one pick job from the run.
 */
export function buildPickRunPickJobsPatchAction(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const pickJobRef = ctx.getNodeParameter('pickJobRef', itemIndex) as string;
	return {
		version: ctx.getNodeParameter('version', itemIndex) as number,
		actions: [{ action: 'RemovePickJobFromPickRun', pickJobRef }],
	};
}
