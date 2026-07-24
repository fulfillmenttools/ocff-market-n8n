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
 * Reduce a pack job response to the most useful fields, for the node's "Simplify"
 * option (a PackJob carries far more than 10 fields).
 */
export function simplifyPackJob(packJob: IDataObject): IDataObject {
	return {
		id: packJob.id,
		shortId: packJob.shortId,
		status: packJob.status,
		facilityRef: packJob.facilityRef,
		orderRef: packJob.orderRef,
		pickJobRef: packJob.pickJobRef,
		tenantOrderId: packJob.tenantOrderId,
		targetTime: packJob.targetTime,
		created: packJob.created,
		lastModified: packJob.lastModified,
		version: packJob.version,
	};
}

/** Assemble a single `PackLineItemForCreation` from one Line Items entry. */
function buildPackLineItem(
	ctx: IExecuteFunctions,
	itemIndex: number,
	entry: IDataObject,
): IDataObject {
	const article = buildArticle(ctx, itemIndex, entry);
	const line: IDataObject = { article, quantity: Number(entry.quantity) };
	for (const key of ['measurementUnitKey', 'secondaryMeasurementUnitKey', 'globalLineItemId'] as const) {
		if (isSet(entry[key])) line[key] = entry[key];
	}
	if (isSet(entry.secondaryQuantity)) line.secondaryQuantity = Number(entry.secondaryQuantity);

	const scannableCodes = splitCsv(entry.scannableCodes);
	if (scannableCodes.length) line.scannableCodes = scannableCodes;
	const serviceJobRefs = splitCsv(entry.serviceJobRefs);
	if (serviceJobRefs.length) line.serviceJobRefs = serviceJobRefs;

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

/**
 * Assemble a `PackJobForCreation` body for `POST /api/packjobs`. `facilityRef`,
 * at least one line item and `workflowInformation` are required.
 */
export function buildPackJobForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const lineEntries = ((get('lineItems', {}) as IDataObject).item as IDataObject[]) ?? [];
	if (!lineEntries.length) {
		throw new NodeOperationError(ctx.getNode(), `No line items provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one line under 'Line Items'.",
		});
	}

	const body: IDataObject = {
		// The Facility is a resourceLocator, so its value needs extractValue.
		facilityRef: ctx.getNodeParameter('facilityRef', itemIndex, '', {
			extractValue: true,
		}) as string,
		lineItems: lineEntries.map((entry) => buildPackLineItem(ctx, itemIndex, entry)),
		// PackJobForCreation requires workflowInformation; default to not-in-workflow.
		workflowInformation:
			buildWorkflowInformation(get('workflowInformation', {}) as IDataObject) ?? {
				isAvailable: false,
			},
	};

	const add = get('additionalFields', {}) as IDataObject;
	for (const key of [
		'orderRef',
		'pickJobRef',
		'tenantOrderId',
		'shortId',
		'recipientName',
		'status',
		'deliveryChannel',
		'processId',
		'operativeProcessRef',
	] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	if (isSet(add.orderDate)) body.orderDate = add.orderDate;
	if (isSet(add.targetTime)) body.targetTime = add.targetTime;
	const custom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	// ----- structured collections -----
	const tags = buildTags({ tags: get('packJobTags', {}) as IDataObject });
	if (tags?.length) body.tags = tags;

	const assignedUsers = buildAssignedUsers({ assignedUsers: get('assignedUsers', {}) as IDataObject });
	if (assignedUsers?.length) body.assignedUsers = assignedUsers;

	const transfers = buildTransfers({ transfers: get('transfers', {}) as IDataObject });
	if (transfers?.length) body.transfers = transfers;

	const invoice = buildConsumerAddress(ctx, itemIndex, get('invoice', {}) as IDataObject, 'Invoice');
	if (invoice) body.invoice = invoice;
	const recipient = buildConsumerAddress(ctx, itemIndex, get('recipient', {}) as IDataObject, 'Recipient');
	if (recipient) body.recipient = recipient;

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/**
 * Assemble a `PackJobPatchActions` body for `PATCH /api/packjobs/{packJobId}`.
 * The three action types (`ModifyPackJob`, `ModifyPackLineItem`, `PausePackJob`)
 * are built from the Update Fields, Line Item Modifications and Pause inputs; any
 * extra raw actions can be appended via the JSON escape hatch.
 */
export function buildPackJobPatchActions(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const actions: IDataObject[] = [];

	// ----- ModifyPackJob (status / custom attributes) -----
	const updateFields = get('updateFields', {}) as IDataObject;
	const modifyPackJob: IDataObject = { action: 'ModifyPackJob' };
	if (isSet(updateFields.status)) modifyPackJob.status = updateFields.status;
	const custom = parseJsonParam(ctx, itemIndex, updateFields.customAttributes, 'Custom Attributes');
	if (custom) modifyPackJob.customAttributes = custom;
	if (Object.keys(modifyPackJob).length > 1) actions.push(modifyPackJob);

	// ----- ModifyPackLineItem (per line item) -----
	const modifications =
		((get('lineItemModifications', {}) as IDataObject).modification as IDataObject[]) ?? [];
	for (const mod of modifications) {
		if (!isSet(mod.id)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`A line item modification is missing its 'Line Item ID' [item ${itemIndex}]`,
				{ itemIndex, description: 'Every modification needs the ID of the pack line item.' },
			);
		}
		const action: IDataObject = { action: 'ModifyPackLineItem', id: mod.id };
		if (isSet(mod.packed)) action.packed = Number(mod.packed);
		actions.push(action);
	}

	// ----- PausePackJob (optional line item updates) -----
	if (get('pausePackJob', false) === true) {
		const pauseAction: IDataObject = { action: 'PausePackJob' };
		const updates =
			((get('pauseLineItemUpdates', {}) as IDataObject).update as IDataObject[]) ?? [];
		const packLineItemsUpdate: IDataObject[] = [];
		for (const update of updates) {
			if (!isSet(update.id) || !isSet(update.packed)) {
				throw new NodeOperationError(
					ctx.getNode(),
					`A pause line item update is missing its 'Line Item ID' or 'Packed' [item ${itemIndex}]`,
					{ itemIndex, description: 'Every pause update needs a line item ID and a packed amount.' },
				);
			}
			packLineItemsUpdate.push({ id: update.id, packed: Number(update.packed) });
		}
		if (packLineItemsUpdate.length) pauseAction.packLineItemsUpdate = packLineItemsUpdate;
		actions.push(pauseAction);
	}

	const extraActions = parseJsonParam(ctx, itemIndex, get('additionalActions', '[]'), 'Additional Actions');
	if (extraActions && Array.isArray(extraActions)) actions.push(...(extraActions as IDataObject[]));

	if (!actions.length) {
		throw new NodeOperationError(ctx.getNode(), `No actions to apply [item ${itemIndex}]`, {
			itemIndex,
			description: 'Set a field to change, add a line item modification, enable Pause, or add a raw action.',
		});
	}

	return {
		version: ctx.getNodeParameter('version', itemIndex) as number,
		actions,
	};
}
