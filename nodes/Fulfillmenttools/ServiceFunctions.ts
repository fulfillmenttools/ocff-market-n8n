import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';
import {
	buildArticle,
	buildAssignedUsers,
	buildLocaleString,
	buildRecordableAttributes,
	splitCsv,
} from './LineItemBuilders';

/** Reduce a service job response to the most useful fields for "Simplify". */
export function simplifyServiceJob(job: IDataObject): IDataObject {
	return {
		id: job.id,
		shortId: job.shortId,
		status: job.status,
		facilityRef: job.facilityRef,
		customServiceRef: job.customServiceRef,
		processRef: job.processRef,
		tenantOrderId: job.tenantOrderId,
		targetTime: job.targetTime,
		created: job.created,
		lastModified: job.lastModified,
		version: job.version,
	};
}

/** Reduce a linked service jobs response to the most useful fields for "Simplify". */
export function simplifyLinkedServiceJobs(linked: IDataObject): IDataObject {
	return {
		id: linked.id,
		status: linked.status,
		channel: linked.channel,
		facilityRef: linked.facilityRef,
		tenantOrderId: linked.tenantOrderId,
		targetTime: linked.targetTime,
		consumerName: linked.consumerName,
		created: linked.created,
		lastModified: linked.lastModified,
		version: linked.version,
	};
}

/** Build a `ServiceJobLineItemForCreation[]` from a Line Items fixedCollection, or undefined. */
function buildLineItems(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries = ((source.lineItems as IDataObject)?.item as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => {
		const line: IDataObject = {
			article: buildArticle(ctx, itemIndex, entry, 'line item'),
			quantity: Number(entry.quantity),
		};
		for (const key of ['measurementUnitKey', 'secondaryMeasurementUnitKey', 'globalLineItemId'] as const) {
			if (isSet(entry[key])) line[key] = entry[key];
		}
		if (isSet(entry.secondaryQuantity)) line.secondaryQuantity = Number(entry.secondaryQuantity);
		const scannableCodes = splitCsv(entry.scannableCodes);
		if (scannableCodes.length) line.scannableCodes = scannableCodes;
		const recordableAttributes = buildRecordableAttributes(ctx, itemIndex, entry);
		if (recordableAttributes) line.recordableAttributes = recordableAttributes;
		const custom = parseJsonParam(ctx, itemIndex, entry.customAttributes, 'Custom Attributes');
		if (custom) line.customAttributes = custom;
		return line;
	});
}

/** Build a `RequiredLineItemForCreation[]` from a Required Line Items fixedCollection, or undefined. */
function buildRequiredLineItems(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries = ((source.requiredLineItems as IDataObject)?.item as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => {
		const line: IDataObject = {
			article: buildArticle(ctx, itemIndex, entry, 'required line item'),
			quantity: Number(entry.quantity),
		};
		for (const key of ['measurementUnitKey', 'secondaryMeasurementUnitKey'] as const) {
			if (isSet(entry[key])) line[key] = entry[key];
		}
		if (isSet(entry.secondaryQuantity)) line.secondaryQuantity = Number(entry.secondaryQuantity);
		const scannableCodes = splitCsv(entry.scannableCodes);
		if (scannableCodes.length) line.scannableCodes = scannableCodes;
		return line;
	});
}

/** Build the `additionalInformation` array from its fixedCollection, or undefined. */
function buildAdditionalInformation(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries = ((source.additionalInformation as IDataObject)?.info as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => {
		if (!isSet(entry.additionalInformationRef) && !isSet(entry.tenantAdditionalInformationRef)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`An additional information entry needs a reference or tenant reference [item ${itemIndex}]`,
				{ itemIndex, description: 'Set either the Ref or the Tenant Ref.' },
			);
		}
		const info: IDataObject = {};
		if (isSet(entry.additionalInformationRef)) info.additionalInformationRef = entry.additionalInformationRef;
		if (isSet(entry.tenantAdditionalInformationRef)) {
			info.tenantAdditionalInformationRef = entry.tenantAdditionalInformationRef;
		}
		if (isSet(entry.value)) {
			const type = (entry.valueType as string) ?? 'string';
			info.value =
				type === 'number'
					? Number(entry.value)
					: type === 'boolean'
						? entry.value === 'true' || entry.value === true
						: entry.value;
		}
		return info;
	});
}

/** Assemble a `ServiceJobForCreation` body for `POST /api/servicejobs`. */
export function buildServiceJobForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		facilityRef: ctx.getNodeParameter('facilityRef', itemIndex, '', {
			extractValue: true,
		}) as string,
		targetTime: get('targetTime') as string,
	};

	const add = get('additionalFields', {}) as IDataObject;
	for (const key of [
		'customServiceRef',
		'tenantCustomServiceId',
		'serviceJobLinkRef',
		'processRef',
		'operativeProcessRef',
		'shortId',
		'tenantOrderId',
	] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	const custom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	const lineItems = buildLineItems(ctx, itemIndex, { lineItems: get('lineItems', {}) as IDataObject });
	if (lineItems) body.lineItems = lineItems;
	const requiredLineItems = buildRequiredLineItems(ctx, itemIndex, {
		requiredLineItems: get('requiredLineItems', {}) as IDataObject,
	});
	if (requiredLineItems) body.requiredLineItems = requiredLineItems;
	const additionalInformation = buildAdditionalInformation(ctx, itemIndex, {
		additionalInformation: get('additionalInformation', {}) as IDataObject,
	});
	if (additionalInformation) body.additionalInformation = additionalInformation;

	const assignedUsers = buildAssignedUsers({ assignedUsers: get('assignedUsers', {}) as IDataObject });
	if (assignedUsers?.length) body.assignedUsers = assignedUsers;

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/** Assemble a `ServiceJobLinkForAdding` body ({ serviceJobRef }). */
export function buildServiceJobLink(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	return { serviceJobRef: ctx.getNodeParameter('serviceJobRef', itemIndex) as string };
}

/** Reduce a custom service response to the most useful fields for "Simplify". */
export function simplifyCustomService(service: IDataObject): IDataObject {
	return {
		id: service.id,
		tenantCustomServiceId: service.tenantCustomServiceId,
		name: service.name,
		status: service.status,
		itemsRequired: service.itemsRequired,
		itemsReturnable: service.itemsReturnable,
		executionTimeInMin: service.executionTimeInMin,
		created: service.created,
		lastModified: service.lastModified,
		version: service.version,
	};
}

/** Reduce a facility custom service connection response for "Simplify". */
export function simplifyFacilityCustomServiceConnection(connection: IDataObject): IDataObject {
	return {
		id: connection.id,
		facilityRef: connection.facilityRef,
		customServiceRef: connection.customServiceRef,
		status: connection.status,
		created: connection.created,
		lastModified: connection.lastModified,
		version: connection.version,
	};
}

/** Build the `additionalInformation` array of a custom service from its fixedCollection. */
function buildCustomServiceAdditionalInformation(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries = ((source.additionalInformation as IDataObject)?.info as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => {
		const nameLocalized = buildLocaleString(entry.nameLocalized);
		if (!nameLocalized) {
			throw new NodeOperationError(
				ctx.getNode(),
				`An additional information entry is missing its localized name [item ${itemIndex}]`,
				{ itemIndex, description: 'Add at least one Name translation.' },
			);
		}
		const info: IDataObject = { nameLocalized, valueType: entry.valueType };
		const descriptionLocalized = buildLocaleString(entry.descriptionLocalized);
		if (descriptionLocalized) info.descriptionLocalized = descriptionLocalized;
		if (entry.isMandatory !== undefined) info.isMandatory = entry.isMandatory === true;
		if (isSet(entry.tenantAdditionalInformationId)) {
			info.tenantAdditionalInformationId = entry.tenantAdditionalInformationId;
		}
		return info;
	});
}

/**
 * Copy the scalar custom-service fields shared by create and update from `source`
 * onto `target`. Localized name/description are handled by the callers, since
 * their source differs between create (top-level) and update (Update Fields).
 */
function applyCustomServiceFields(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
	target: IDataObject,
): void {
	for (const key of ['status', 'itemsRequired', 'tenantCustomServiceId'] as const) {
		if (isSet(source[key])) target[key] = source[key];
	}
	if (source.itemsReturnable !== undefined) target.itemsReturnable = source.itemsReturnable === true;
	if (isSet(source.executionTimeInMin)) target.executionTimeInMin = Number(source.executionTimeInMin);

	const custom = parseJsonParam(ctx, itemIndex, source.customAttributes, 'Custom Attributes');
	if (custom) target.customAttributes = custom;
}

/** Assemble a `CustomServiceForCreation` body for `POST /api/customservices`. */
export function buildCustomServiceForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const nameLocalized = buildLocaleString(get('nameLocalized', {}));
	if (!nameLocalized) {
		throw new NodeOperationError(ctx.getNode(), `The localized name is required [item ${itemIndex}]`, {
			itemIndex,
			description: 'Add at least one Name translation.',
		});
	}

	const body: IDataObject = {
		nameLocalized,
		// status and itemsRequired are top-level required parameters on create.
		status: get('status') as string,
		itemsRequired: get('itemsRequired') as string,
	};

	const descriptionLocalized = buildLocaleString(get('descriptionLocalized', {}));
	if (descriptionLocalized) body.descriptionLocalized = descriptionLocalized;

	applyCustomServiceFields(ctx, itemIndex, get('additionalFields', {}) as IDataObject, body);

	const imageRefs = splitCsv((get('additionalFields', {}) as IDataObject).imageRefs);
	if (imageRefs.length) body.imageRefs = imageRefs;

	const additionalInformation = buildCustomServiceAdditionalInformation(ctx, itemIndex, {
		additionalInformation: get('additionalInformation', {}) as IDataObject,
	});
	if (additionalInformation) body.additionalInformation = additionalInformation;

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/** Assemble a `CustomServiceForUpdate` body for `PATCH /api/customservices/{id}`. */
export function buildCustomServiceForUpdate(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = { version: get('version') as number };

	const updateFields = get('updateFields', {}) as IDataObject;
	const nameLocalized = buildLocaleString(updateFields.nameLocalized);
	if (nameLocalized) body.nameLocalized = nameLocalized;
	const descriptionLocalized = buildLocaleString(updateFields.descriptionLocalized);
	if (descriptionLocalized) body.descriptionLocalized = descriptionLocalized;
	applyCustomServiceFields(ctx, itemIndex, updateFields, body);

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}
