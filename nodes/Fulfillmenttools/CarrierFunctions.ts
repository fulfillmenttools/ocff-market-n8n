import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

const PARCEL_DIMENSIONS = [
	'defaultParcelHeightInCm',
	'defaultParcelLengthInCm',
	'defaultParcelWeightInGram',
	'defaultParcelWidthInCm',
] as const;

/**
 * Assemble a `CarrierForCreation` request body. Required by the API: key, name.
 * Common fields come from "Additional Fields"; anything deeper (credentials,
 * parcelLabelClassifications) can be supplied via "Additional Body Fields
 * (JSON)".
 */
export function buildCarrierForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		key: get('key') as string,
		name: get('name') as string,
	};

	const additionalFields = get('additionalFields', {}) as IDataObject;
	for (const key of ['status', 'logoUrl'] as const) {
		if (isSet(additionalFields[key])) body[key] = additionalFields[key];
	}
	for (const key of PARCEL_DIMENSIONS) {
		if (isSet(additionalFields[key])) body[key] = additionalFields[key];
	}
	if (additionalFields.productValueNeeded !== undefined) {
		body.productValueNeeded = additionalFields.productValueNeeded;
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
 * Assemble a `CarrierPatchActions` PATCH body. `version` is required (optimistic
 * locking). The API applies an array of actions; here we build a single
 * `ModifyCarrier` action carrying the changed fields. Advanced fields
 * (credentials, parcelLabelClassifications) can be added via "Additional Body
 * Fields (JSON)", which is merged into that action.
 */
export function buildCarrierPatchActions(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const action: IDataObject = { action: 'ModifyCarrier' };

	const updateFields = get('updateFields', {}) as IDataObject;
	for (const key of ['name', 'status', 'deliveryType', 'lifecycle', 'logoUrl'] as const) {
		if (isSet(updateFields[key])) action[key] = updateFields[key];
	}
	for (const key of PARCEL_DIMENSIONS) {
		if (isSet(updateFields[key])) action[key] = updateFields[key];
	}
	if (updateFields.productValueNeeded !== undefined) {
		action.productValueNeeded = updateFields.productValueNeeded;
	}

	const advanced = parseJsonParam(
		ctx,
		itemIndex,
		get('additionalBodyFields', '{}'),
		'Additional Body Fields',
	);
	if (advanced) Object.assign(action, advanced);

	return {
		version: get('version') as number,
		actions: [action],
	};
}

/**
 * Reduce a carrier response to a small set of the most useful fields, for the
 * node's "Simplify" option.
 */
export function simplifyCarrier(carrier: IDataObject): IDataObject {
	return {
		id: carrier.id,
		name: carrier.name,
		key: carrier.key,
		status: carrier.status,
		deliveryType: carrier.deliveryType,
		lifecycle: carrier.lifecycle,
		version: carrier.version,
		created: carrier.created,
		lastModified: carrier.lastModified,
	};
}
