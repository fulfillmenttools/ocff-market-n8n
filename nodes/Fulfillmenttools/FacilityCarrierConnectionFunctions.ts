import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

const CLASSIFICATION_DIMENSIONS = ['height', 'length', 'width', 'weight', 'customWeight'] as const;

/**
 * Apply the structured body fields shared by the create and modification
 * bodies: validDeliveryTargets, cutoffTime, deliveryAreas, tags,
 * parcelLabelClassifications, configuration and credentials. Each field is only
 * written when the user actually provided something, so an untouched field is
 * omitted from the request body. Mutates and returns `body`.
 */
function applyStructuredFields(
	ctx: IExecuteFunctions,
	itemIndex: number,
	body: IDataObject,
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const validDeliveryTargets = get('validDeliveryTargets', []) as string[];
	if (validDeliveryTargets.length > 0) body.validDeliveryTargets = validDeliveryTargets;

	const cutoffTime = (get('cutoffTime', {}) as IDataObject).value as IDataObject | undefined;
	if (cutoffTime && isSet(cutoffTime.hour) && isSet(cutoffTime.minute)) {
		body.cutoffTime = { hour: cutoffTime.hour, minute: cutoffTime.minute };
	}

	const deliveryAreas = (get('deliveryAreas', {}) as IDataObject).area as IDataObject[] | undefined;
	if (deliveryAreas && deliveryAreas.length > 0) {
		body.deliveryAreas = deliveryAreas.map((area) => ({
			country: area.country,
			postalCode: area.postalCode,
		}));
	}

	const tags = (get('tags', {}) as IDataObject).tag as IDataObject[] | undefined;
	if (tags && tags.length > 0) {
		body.tags = tags.map((tag) => ({ id: tag.id, value: tag.value }));
	}

	const classifications =
		(get('parcelLabelClassifications', {}) as IDataObject).classification as
			| IDataObject[]
			| undefined;
	if (classifications && classifications.length > 0) {
		body.parcelLabelClassifications = classifications.map((entry) => {
			const locale = isSet(entry.locale) ? (entry.locale as string) : 'en_US';
			const dimensions: IDataObject = {};
			for (const key of CLASSIFICATION_DIMENSIONS) {
				if (isSet(entry[key])) dimensions[key] = entry[key];
			}
			const classification: IDataObject = {
				nameLocalized: { [locale]: entry.name },
				dimensions,
			};
			if (entry.bulkyGoods !== undefined) {
				classification.services = { bulkyGoods: entry.bulkyGoods };
			}
			return classification;
		});
	}

	const configuration = parseJsonParam(ctx, itemIndex, get('configuration', '{}'), 'Configuration');
	if (configuration && Object.keys(configuration).length > 0) body.configuration = configuration;

	const credentials = parseJsonParam(ctx, itemIndex, get('credentials', '{}'), 'Credentials');
	if (credentials && Object.keys(credentials).length > 0) body.credentials = credentials;

	return body;
}

/**
 * Assemble a `FacilityCarrierConnectionForCreation` body. No fields are
 * required by the API; name and status are exposed directly,
 * validDeliveryTargets, cutoffTime, deliveryAreas and tags have their own
 * structured fields, and the deeper carrier-specific objects (configuration,
 * credentials, cutoffTimes, parcelLabelClassifications) can be supplied via
 * "Additional Body Fields (JSON)".
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

	applyStructuredFields(ctx, itemIndex, body);

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

	applyStructuredFields(ctx, itemIndex, body);

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
