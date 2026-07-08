import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

/**
 * Assemble a `FacilityCarrierConnectionForCreation` body. No fields are
 * required by the API; name and status are exposed directly, and the deeper
 * carrier-specific objects (configuration, credentials, cutoffTimes,
 * deliveryAreas, validDeliveryTargets, parcelLabelClassifications, tags) can be
 * supplied via "Additional Body Fields (JSON)".
 */
export function buildFacilityCarrierConnectionForCreation(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {};

	const additionalFields = get('additionalFields', {}) as IDataObject;
	if (isSet(additionalFields.name)) body.name = additionalFields.name;
	if (isSet(additionalFields.status)) body.status = additionalFields.status;

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
 * Assemble a `FacilityCarrierConnectionForModification` body (used by the PUT
 * update). `version` is required (optimistic locking).
 */
export function buildFacilityCarrierConnectionForModification(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		version: get('version') as number,
	};

	const updateFields = get('updateFields', {}) as IDataObject;
	if (isSet(updateFields.name)) body.name = updateFields.name;
	if (isSet(updateFields.status)) body.status = updateFields.status;

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
 * Reduce a facility carrier connection (or a stripped carrier from the list) to
 * a small set of the most useful fields, for the node's "Simplify" option.
 */
export function simplifyFacilityCarrierConnection(entity: IDataObject): IDataObject {
	return {
		id: entity.id,
		name: entity.name,
		key: entity.key,
		status: entity.status,
		carrierRef: entity.carrierRef,
		facilityRef: entity.facilityRef,
		version: entity.version,
		created: entity.created,
		lastModified: entity.lastModified,
	};
}
