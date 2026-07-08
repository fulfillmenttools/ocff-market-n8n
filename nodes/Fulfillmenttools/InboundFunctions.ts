import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

function splitCsv(value: unknown): string[] {
	return String(value)
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
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
