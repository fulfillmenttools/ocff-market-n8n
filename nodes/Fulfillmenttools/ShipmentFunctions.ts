import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';
import {
	buildArticle,
	buildConsumerAddress,
	buildRecordableAttributes,
	buildTags,
	buildTransfers,
	splitCsv,
} from './LineItemBuilders';

/** Reduce a parcel response to the most useful fields for "Simplify". */
export function simplifyParcel(parcel: IDataObject): IDataObject {
	const result = (parcel.result as IDataObject) ?? {};
	return {
		id: parcel.id,
		shortId: parcel.shortId,
		status: parcel.status,
		shipmentRef: parcel.shipmentRef,
		carrierRef: parcel.carrierRef,
		tenantOrderId: parcel.tenantOrderId,
		carrierTrackingNumber: result.carrierTrackingNumber,
		trackingUrl: result.trackingUrl,
		created: parcel.created,
		lastModified: parcel.lastModified,
		version: parcel.version,
	};
}

/** Reduce a shipment response to the most useful fields for "Simplify". */
export function simplifyShipment(shipment: IDataObject): IDataObject {
	return {
		id: shipment.id,
		shortId: shipment.shortId,
		status: shipment.status,
		facilityRef: shipment.facilityRef,
		carrierRef: shipment.carrierRef,
		pickJobRef: shipment.pickJobRef,
		tenantOrderId: shipment.tenantOrderId,
		targetTime: shipment.targetTime,
		created: shipment.created,
		lastModified: shipment.lastModified,
		version: shipment.version,
	};
}

/** Build a `ParcelDimensions` object from a dimensions collection, or undefined. */
function buildDimensions(source: IDataObject): IDataObject | undefined {
	const dimensions: IDataObject = {};
	for (const key of ['length', 'width', 'height', 'weight', 'customWeight'] as const) {
		if (isSet(source[key])) dimensions[key] = Number(source[key]);
	}
	return Object.keys(dimensions).length ? dimensions : undefined;
}

/** Build a `ParcelServices` object (booleans) from a services collection, or undefined. */
function buildServices(source: IDataObject): IDataObject | undefined {
	const services: IDataObject = {};
	for (const key of [
		'additionalTransportInsurance',
		'adultSignature',
		'bulkyGoods',
		'customerSignature',
		'handoverToRecipientOnly',
		'identityAgeCheck18',
		'identityCheckCompany',
		'identityCheckPrivate',
		'noNeighborDelivery',
		'saturdayDelivery',
		'signature',
	] as const) {
		if (source[key] === true) services[key] = true;
	}
	return Object.keys(services).length ? services : undefined;
}

/** Build a `ParcelPickUpInformation` object, or undefined. Both times are required together. */
function buildPickUpInformation(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject | undefined {
	const hasStart = isSet(source.startTime);
	const hasEnd = isSet(source.endTime);
	if (!hasStart && !hasEnd) return undefined;
	if (!hasStart || !hasEnd) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Pick-up information needs both a start and end time [item ${itemIndex}]`,
			{ itemIndex },
		);
	}
	return { startTime: source.startTime, endTime: source.endTime };
}

/** Assemble a single `ParcelItemForCreation` from one Items entry. */
function buildParcelItem(ctx: IExecuteFunctions, itemIndex: number, entry: IDataObject): IDataObject {
	const item: IDataObject = {
		article: buildArticle(ctx, itemIndex, entry, 'parcel item'),
		quantity: Number(entry.quantity),
	};
	if (isSet(entry.description)) item.description = entry.description;
	const custom = parseJsonParam(ctx, itemIndex, entry.customAttributes, 'Custom Attributes');
	if (custom) item.customAttributes = custom;
	return item;
}

/** Shared assembly of the fields common to a `ParcelForCreation` body. */
export function buildParcelForCreation(
	ctx: IExecuteFunctions,
	itemIndex: number,
	options: { allowCarrierRef: boolean },
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {};

	const add = get('additionalFields', {}) as IDataObject;
	for (const key of [
		'carrierProduct',
		'shortId',
		'status',
		'tenantOrderId',
		'tenantParcelId',
		'parentRef',
		'productValueType',
	] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	if (options.allowCarrierRef && isSet(add.carrierRef)) body.carrierRef = add.carrierRef;
	if (isSet(add.customProductValue)) body.customProductValue = Number(add.customProductValue);
	if (isSet(add.productValue)) body.productValue = Number(add.productValue);
	if (isSet(add.shippingContainerNumber)) {
		body.carrierInformation = { shippingContainerNumber: add.shippingContainerNumber };
	}
	if (isSet(add.paymentCurrency)) body.paymentInformation = { currency: add.paymentCurrency };
	if (isSet(add.productValueCurrency)) {
		const currency: IDataObject = { currency: add.productValueCurrency };
		if (isSet(add.productValueDecimalPlaces)) {
			currency.decimalPlaces = Number(add.productValueDecimalPlaces);
		}
		body.productValueCurrency = currency;
	}
	const loadUnitRefs = splitCsv(add.loadUnitRefs);
	if (loadUnitRefs.length) body.loadUnitRefs = loadUnitRefs;
	const custom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	// ----- items -----
	const itemEntries = ((get('items', {}) as IDataObject).item as IDataObject[]) ?? [];
	if (itemEntries.length) {
		body.items = itemEntries.map((entry) => buildParcelItem(ctx, itemIndex, entry));
	}

	// ----- structured objects -----
	const dimensions = buildDimensions(get('dimensions', {}) as IDataObject);
	if (dimensions) body.dimensions = dimensions;
	const services = buildServices(get('services', {}) as IDataObject);
	if (services) body.services = services;
	const pickUp = buildPickUpInformation(ctx, itemIndex, get('pickUpInformation', {}) as IDataObject);
	if (pickUp) body.pickUpInformation = pickUp;

	const invoice = buildConsumerAddress(ctx, itemIndex, get('invoice', {}) as IDataObject, 'Invoice');
	if (invoice) body.invoice = invoice;
	const recipient = buildConsumerAddress(ctx, itemIndex, get('recipient', {}) as IDataObject, 'Recipient');
	if (recipient) body.recipient = recipient;

	const transfers = buildTransfers({ transfers: get('transfers', {}) as IDataObject });
	if (transfers?.length) body.transfers = transfers;

	// ----- deep structures as dedicated JSON fields -----
	for (const [param, key] of [
		['sender', 'sender'],
		['returnAddress', 'returnAddress'],
		['result', 'result'],
	] as const) {
		const value = parseJsonParam(ctx, itemIndex, get(param, undefined), param);
		if (value) body[key] = value;
	}

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/** Assemble a `ParcelPatchActions` body for `PATCH /api/parcels/{parcelId}`. */
export function buildParcelPatchActions(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const actions: IDataObject[] = [];

	// ----- ModifyParcel -----
	const updateFields = get('updateFields', {}) as IDataObject;
	const modify: IDataObject = { action: 'ModifyParcel' };
	for (const key of ['status', 'carrierProduct', 'tenantParcelId'] as const) {
		if (isSet(updateFields[key])) modify[key] = updateFields[key];
	}
	if (isSet(updateFields.customProductValue)) modify.customProductValue = Number(updateFields.customProductValue);
	if (isSet(updateFields.productValue)) modify.productValue = Number(updateFields.productValue);
	if (isSet(updateFields.shippingContainerNumber)) {
		modify.carrierInformation = { shippingContainerNumber: updateFields.shippingContainerNumber };
	}
	const dimensions = buildDimensions(get('dimensions', {}) as IDataObject);
	if (dimensions) modify.dimensions = dimensions;
	const services = buildServices(get('services', {}) as IDataObject);
	if (services) modify.services = services;
	const pickUp = buildPickUpInformation(ctx, itemIndex, get('pickUpInformation', {}) as IDataObject);
	if (pickUp) modify.pickUpInformation = pickUp;
	const custom = parseJsonParam(ctx, itemIndex, updateFields.customAttributes, 'Custom Attributes');
	if (custom) modify.customAttributes = custom;
	const result = parseJsonParam(ctx, itemIndex, updateFields.result, 'Result');
	if (result) modify.result = result;
	if (Object.keys(modify).length > 1) actions.push(modify);

	// ----- ModifyParcelLoadUnit -----
	const loadUnitRefs = splitCsv(updateFields.loadUnitRefs);
	if (loadUnitRefs.length) actions.push({ action: 'ModifyParcelLoadUnit', loadUnitRefs });

	const extraActions = parseJsonParam(ctx, itemIndex, get('additionalActions', '[]'), 'Additional Actions');
	if (extraActions && Array.isArray(extraActions)) actions.push(...(extraActions as IDataObject[]));

	if (!actions.length) {
		throw new NodeOperationError(ctx.getNode(), `No actions to apply [item ${itemIndex}]`, {
			itemIndex,
			description: "Set a field under 'Update Fields' or add a raw action.",
		});
	}

	return { version: ctx.getNodeParameter('version', itemIndex) as number, actions };
}

/** Assemble a single `ShipmentLineItemForCreation`. */
function buildShipmentLineItem(
	ctx: IExecuteFunctions,
	itemIndex: number,
	entry: IDataObject,
): IDataObject {
	const line: IDataObject = {
		article: buildArticle(ctx, itemIndex, entry, 'shipment line item'),
		quantity: Number(entry.quantity),
	};
	if (isSet(entry.measurementUnitKey)) line.measurementUnitKey = entry.measurementUnitKey;
	const scannableCodes = splitCsv(entry.scannableCodes);
	if (scannableCodes.length) line.scannableCodes = scannableCodes;
	const tags = buildTags(entry);
	if (tags) line.tags = tags;
	const recordableAttributes = buildRecordableAttributes(ctx, itemIndex, entry);
	if (recordableAttributes) line.recordableAttributes = recordableAttributes;
	const custom = parseJsonParam(ctx, itemIndex, entry.customAttributes, 'Custom Attributes');
	if (custom) line.customAttributes = custom;
	return line;
}

/** Assemble a `ShipmentForCreation` body for `POST /api/shipments`. */
export function buildShipmentForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const body: IDataObject = {
		facilityRef: ctx.getNodeParameter('facilityRef', itemIndex, '', {
			extractValue: true,
		}) as string,
		orderDate: get('orderDate') as string,
		targetTime: get('targetTime') as string,
	};

	const add = get('additionalFields', {}) as IDataObject;
	for (const key of [
		'carrierRef',
		'carrierProduct',
		'carrierLogoUrl',
		'shortId',
		'tenantOrderId',
		'pickJobRef',
		'processId',
		'operativeProcessRef',
		'targetTimeBaseDate',
	] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	if (isSet(add.paymentCurrency)) body.paymentInformation = { currency: add.paymentCurrency };
	const custom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	// ----- line items -----
	const lineEntries = ((get('lineItems', {}) as IDataObject).item as IDataObject[]) ?? [];
	if (lineEntries.length) {
		body.lineItems = lineEntries.map((entry) => buildShipmentLineItem(ctx, itemIndex, entry));
	}

	// ----- addresses -----
	const invoiceAddress = buildConsumerAddress(ctx, itemIndex, get('invoiceAddress', {}) as IDataObject, 'Invoice Address');
	if (invoiceAddress) body.invoiceAddress = invoiceAddress;
	const postalAddress = buildConsumerAddress(ctx, itemIndex, get('postalAddress', {}) as IDataObject, 'Postal Address');
	if (postalAddress) body.postalAddress = postalAddress;
	const targetAddress = buildConsumerAddress(ctx, itemIndex, get('targetAddress', {}) as IDataObject, 'Target Address');
	if (targetAddress) body.targetAddress = targetAddress;

	const transfers = buildTransfers({ transfers: get('transfers', {}) as IDataObject });
	if (transfers?.length) body.transfers = transfers;
	const tags = buildTags({ tags: get('shipmentTags', {}) as IDataObject });
	if (tags?.length) body.tags = tags;

	for (const [param, key] of [
		['sourceAddress', 'sourceAddress'],
		['carrierServices', 'carrierServices'],
	] as const) {
		const value = parseJsonParam(ctx, itemIndex, get(param, undefined), param);
		if (value) body[key] = value;
	}

	const advanced = parseJsonParam(ctx, itemIndex, get('additionalBodyFields', '{}'), 'Additional Body Fields');
	if (advanced) Object.assign(body, advanced);

	return body;
}

/** Assemble a `ShipmentPatchActions` body for `PATCH /api/shipments/{shipmentId}`. */
export function buildShipmentPatchActions(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const actions: IDataObject[] = [];
	const updateFields = get('updateFields', {}) as IDataObject;
	const modify: IDataObject = { action: 'ModifyShipment' };
	for (const key of ['status', 'carrierProduct', 'carrierRef', 'pickJobRef'] as const) {
		if (isSet(updateFields[key])) modify[key] = updateFields[key];
	}
	if (isSet(updateFields.paymentCurrency)) {
		modify.paymentInformation = { currency: updateFields.paymentCurrency };
	}
	const targetAddress = buildConsumerAddress(ctx, itemIndex, get('targetAddress', {}) as IDataObject, 'Target Address');
	if (targetAddress) modify.targetAddress = targetAddress;
	if (Object.keys(modify).length > 1) actions.push(modify);

	const extraActions = parseJsonParam(ctx, itemIndex, get('additionalActions', '[]'), 'Additional Actions');
	if (extraActions && Array.isArray(extraActions)) actions.push(...(extraActions as IDataObject[]));

	if (!actions.length) {
		throw new NodeOperationError(ctx.getNode(), `No actions to apply [item ${itemIndex}]`, {
			itemIndex,
			description: "Set a field under 'Update Fields' or add a raw action.",
		});
	}

	return { version: ctx.getNodeParameter('version', itemIndex) as number, actions };
}

/** Assemble a `ReturnNote` body for `POST /api/returnnotes`. */
export function buildReturnNote(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const orderInfo = get('orderInformation', {}) as IDataObject;
	const orderInformation: IDataObject = {};
	if (isSet(orderInfo.orderDate)) orderInformation.orderDate = orderInfo.orderDate;
	if (isSet(orderInfo.orderNumber)) orderInformation.orderNumber = orderInfo.orderNumber;

	const itemEntries = ((get('items', {}) as IDataObject).item as IDataObject[]) ?? [];
	if (!itemEntries.length) {
		throw new NodeOperationError(ctx.getNode(), `No return note items provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one item under 'Items'.",
		});
	}
	const items = itemEntries.map((entry) => {
		if (!isSet(entry.title)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`A return note item is missing its 'Title' [item ${itemIndex}]`,
				{ itemIndex, description: 'Every return note item needs a title.' },
			);
		}
		const item: IDataObject = { title: entry.title };
		if (isSet(entry.id)) item.id = entry.id;
		if (isSet(entry.quantity)) item.quantity = Number(entry.quantity);
		const substitutes = splitCsv(entry.substitutes);
		if (substitutes.length) item.substitutes = substitutes;
		return item;
	});

	const body: IDataObject = { orderInformation, items };

	const qrCodeContent = get('qrCodeContent', '') as string;
	if (isSet(qrCodeContent)) body.qrCodeContent = qrCodeContent;

	const companyAddress = get('companyAddress', {}) as IDataObject;
	if (Object.values(companyAddress).some((value) => isSet(value))) body.companyAddress = companyAddress;
	const deliveryAddress = get('deliveryAddress', {}) as IDataObject;
	if (Object.values(deliveryAddress).some((value) => isSet(value))) body.deliveryAddress = deliveryAddress;

	const deliveryAddresses = parseJsonParam(ctx, itemIndex, get('deliveryAddresses', undefined), 'Delivery Addresses');
	if (deliveryAddresses && Array.isArray(deliveryAddresses)) body.deliveryAddresses = deliveryAddresses;

	return body;
}
