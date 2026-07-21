import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export function parseJsonParam(
	ctx: IExecuteFunctions,
	itemIndex: number,
	raw: unknown,
	label: string,
): IDataObject | undefined {
	if (raw === undefined || raw === null || raw === '') return undefined;
	if (typeof raw === 'object') return raw as IDataObject;
	try {
		return JSON.parse(raw as string) as IDataObject;
	} catch {
		throw new NodeOperationError(ctx.getNode(), `${label} must be valid JSON`, { itemIndex });
	}
}

/**
 * Reduce a facility response to a small set of the most useful fields, for the
 * node's "Simplify" option (facility payloads have far more than 10 fields).
 */
export function simplifyFacility(facility: IDataObject): IDataObject {
	const address = (facility.address as IDataObject) ?? {};
	return {
		id: facility.id,
		name: facility.name,
		tenantFacilityId: facility.tenantFacilityId,
		status: facility.status,
		type: facility.type,
		locationType: facility.locationType,
		address: {
			companyName: address.companyName,
			street: address.street,
			houseNumber: address.houseNumber,
			postalCode: address.postalCode,
			city: address.city,
			country: address.country,
		},
		created: facility.created,
		lastModified: facility.lastModified,
	};
}

export function isSet(value: unknown): boolean {
	return value !== undefined && value !== null && value !== '';
}

/** Accessor over a single item's node parameters. */
type ParamGetter = (name: string, fallback?: unknown) => unknown;

/** Raw address field values, sourced differently per operation. */
interface AddressFieldValues {
	companyName?: unknown;
	street?: unknown;
	city?: unknown;
	postalCode?: unknown;
	country?: unknown;
	houseNumber?: unknown;
	additionalAddressInfo?: unknown;
	province?: unknown;
	customAttributes?: unknown;
	timeZoneId?: unknown;
	latitude?: unknown;
	longitude?: unknown;
}

/**
 * Assemble a `FacilityAddressForCreation` object shared by the managed-facility
 * create and modification operations. Scalar keys in `alwaysKeys` are set
 * unconditionally (they are required on create); all others are only set when
 * the user provided a value. Phone numbers and email addresses are read via the
 * shared `phoneNumbers` / `emailAddresses` parameters.
 */
function buildAddress(
	ctx: IExecuteFunctions,
	itemIndex: number,
	get: ParamGetter,
	fields: AddressFieldValues,
	alwaysKeys: readonly (keyof AddressFieldValues)[] = [],
): IDataObject {
	const address: IDataObject = {};

	const scalarKeys: (keyof AddressFieldValues)[] = [
		'companyName',
		'street',
		'city',
		'postalCode',
		'country',
		'houseNumber',
		'additionalAddressInfo',
		'province',
	];
	for (const key of scalarKeys) {
		const value = fields[key];
		if (alwaysKeys.includes(key) || isSet(value)) address[key] = value as string;
	}

	const addrCustom = parseJsonParam(ctx, itemIndex, fields.customAttributes, 'Address Custom Attributes');
	if (addrCustom) address.customAttributes = addrCustom;
	if (isSet(fields.timeZoneId)) address.resolvedTimeZone = { timeZoneId: fields.timeZoneId };

	const hasLat = isSet(fields.latitude);
	const hasLon = isSet(fields.longitude);
	if (hasLat !== hasLon) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Both Latitude and Longitude are required to set coordinates',
			{ itemIndex },
		);
	}
	if (hasLat && hasLon) {
		address.resolvedCoordinates = { lat: Number(fields.latitude), lon: Number(fields.longitude) };
	}

	const phones = ((get('phoneNumbers', {}) as IDataObject).number as IDataObject[]) ?? [];
	if (phones.length) {
		address.phoneNumbers = phones.map((p) => {
			const entry: IDataObject = { value: p.value, type: p.type };
			if (isSet(p.label)) entry.label = p.label;
			return entry;
		});
	}

	const emails = ((get('emailAddresses', {}) as IDataObject).email as IDataObject[]) ?? [];
	if (emails.length) {
		address.emailAddresses = emails.map((e) => {
			const entry: IDataObject = { value: e.value };
			if (isSet(e.recipient)) entry.recipient = e.recipient;
			return entry;
		});
	}

	return address;
}

/**
 * Build a `FacilityContact` object from a Contact collection. Returns undefined
 * when neither name is set; throws when only one of the two names is provided.
 */
function buildContact(
	ctx: IExecuteFunctions,
	itemIndex: number,
	contact: IDataObject,
): IDataObject | undefined {
	if (!isSet(contact.firstName) && !isSet(contact.lastName)) return undefined;
	if (!isSet(contact.firstName) || !isSet(contact.lastName)) {
		throw new NodeOperationError(ctx.getNode(), 'Contact requires both First Name and Last Name', {
			itemIndex,
		});
	}
	const c: IDataObject = { firstName: contact.firstName, lastName: contact.lastName };
	if (isSet(contact.roleDescription)) c.roleDescription = contact.roleDescription;
	const contactCustom = parseJsonParam(
		ctx,
		itemIndex,
		contact.customAttributes,
		'Contact Custom Attributes',
	);
	if (contactCustom) c.customAttributes = contactCustom;
	return c;
}

/** Build the `tags` array from the Tags fixedCollection, or undefined if empty. */
function buildTags(get: ParamGetter): IDataObject[] | undefined {
	const tags = ((get('tags', {}) as IDataObject).tag as IDataObject[]) ?? [];
	if (!tags.length) return undefined;
	return tags.map((t) => ({ id: t.id, value: t.value }));
}

/** Build the `services` array from the Services multiOptions, or undefined if empty. */
function buildServices(get: ParamGetter): IDataObject[] | undefined {
	const services = (get('services', []) as string[]) ?? [];
	if (!services.length) return undefined;
	return services.map((type) => ({ type }));
}

/** Build the `pickingMethods` array from the multiOptions, or undefined if empty. */
function buildPickingMethods(get: ParamGetter): string[] | undefined {
	const pickingMethods = (get('pickingMethods', []) as string[]) ?? [];
	if (!pickingMethods.length) return undefined;
	return pickingMethods;
}

/** Build the `closingDays` array from the fixedCollection, or undefined if empty. */
function buildClosingDays(get: ParamGetter): IDataObject[] | undefined {
	const closingDays = ((get('closingDays', {}) as IDataObject).day as IDataObject[]) ?? [];
	if (!closingDays.length) return undefined;
	return closingDays.map((d) => ({ date: d.date, reason: d.reason, recurrence: d.recurrence }));
}

/** Build the `scanningRule` object from the Scanning Rules fixedCollection, or undefined if empty. */
function buildScanningRule(get: ParamGetter): IDataObject | undefined {
	const scanningRules = ((get('scanningRules', {}) as IDataObject).rule as IDataObject[]) ?? [];
	if (!scanningRules.length) return undefined;
	return {
		values: scanningRules.map((r) => ({
			scanningRuleType: r.scanningRuleType,
			priority: Number(r.priority),
		})),
	};
}

/** Build the `pickingTimes` object (grouped per weekday) from the fixedCollection, or undefined if empty. */
function buildPickingTimes(get: ParamGetter): IDataObject | undefined {
	const ranges = ((get('pickingTimes', {}) as IDataObject).range as IDataObject[]) ?? [];
	if (!ranges.length) return undefined;
	const pickingTimes: IDataObject = {};
	for (const r of ranges) {
		const weekday = r.weekday as string;
		const range: IDataObject = {
			start: { hour: Number(r.startHour), minute: Number(r.startMinute) },
			end: { hour: Number(r.endHour), minute: Number(r.endMinute) },
		};
		if (isSet(r.capacity) && Number(r.capacity) > 0) range.capacity = Number(r.capacity);
		const existing = (pickingTimes[weekday] as IDataObject[]) ?? [];
		existing.push(range);
		pickingTimes[weekday] = existing;
	}
	return pickingTimes;
}

/**
 * Assemble a `ManagedFacilityForCreation` request body from the node parameters
 * for a single input item. Mirrors the full fulfillmenttools facility schema.
 */
export function buildManagedFacilityForCreation(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	// ----- address -----
	const addr = get('addressAdditionalFields', {}) as IDataObject;
	const address = buildAddress(
		ctx,
		itemIndex,
		get,
		{
			companyName: get('companyName'),
			street: get('street'),
			city: get('city'),
			postalCode: get('postalCode'),
			country: get('country'),
			houseNumber: get('houseNumber', ''),
			additionalAddressInfo: addr.additionalAddressInfo,
			province: addr.province,
			customAttributes: addr.customAttributes,
			timeZoneId: addr.timeZoneId,
			latitude: addr.latitude,
			longitude: addr.longitude,
		},
		['companyName', 'street', 'city', 'postalCode', 'country'],
	);

	// ----- base body -----
	const body: IDataObject = {
		type: 'MANAGED_FACILITY',
		name: get('name') as string,
		address,
	};

	// ----- top-level additional fields -----
	const add = get('additionalFields', {}) as IDataObject;
	for (const key of ['tenantFacilityId', 'status', 'locationType'] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	for (const key of ['fulfillmentProcessBuffer', 'capacityPlanningTimeframe'] as const) {
		if (isSet(add[key])) body[key] = add[key];
	}
	if (add.capacityEnabled !== undefined) body.capacityEnabled = add.capacityEnabled;
	const facilityCustom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (facilityCustom) body.customAttributes = facilityCustom;

	// ----- contact -----
	const contact = buildContact(ctx, itemIndex, get('contact', {}) as IDataObject);
	if (contact) body.contact = contact;

	// ----- tags -----
	const tags = buildTags(get);
	if (tags) body.tags = tags;

	// ----- services & picking methods -----
	const services = buildServices(get);
	if (services) body.services = services;

	const pickingMethods = buildPickingMethods(get);
	if (pickingMethods) body.pickingMethods = pickingMethods;

	// ----- operative cost (maxItems 1) -----
	const cost = get('operativeCost', {}) as IDataObject;
	if (isSet(cost.value)) {
		const entry: IDataObject = {
			value: cost.value,
			currency: isSet(cost.currency) ? cost.currency : 'EUR',
		};
		if (isSet(cost.decimalPlaces)) entry.decimalPlaces = cost.decimalPlaces;
		body.operativeCosts = [entry];
	}

	// ----- closing days -----
	const closingDays = buildClosingDays(get);
	if (closingDays) body.closingDays = closingDays;

	// ----- scanning rule -----
	const scanningRule = buildScanningRule(get);
	if (scanningRule) body.scanningRule = scanningRule;

	// ----- picking times (grouped per weekday) -----
	const pickingTimes = buildPickingTimes(get);
	if (pickingTimes) body.pickingTimes = pickingTimes;

	return body;
}

/**
 * Assemble a `SupplierForCreation` request body. Suppliers use a simpler
 * payload: only name + address (companyName and country required) plus optional
 * base fields. Managed-facility-only fields (picking, services, contact, etc.)
 * do not apply.
 */
export function buildSupplierForCreation(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const address: IDataObject = {
		companyName: get('companyName') as string,
		country: get('country') as string,
	};

	const addr = get('supplierAddress', {}) as IDataObject;
	for (const key of [
		'street',
		'city',
		'postalCode',
		'houseNumber',
		'additionalAddressInfo',
		'province',
	] as const) {
		if (isSet(addr[key])) address[key] = addr[key];
	}
	const addrCustom = parseJsonParam(ctx, itemIndex, addr.customAttributes, 'Address Custom Attributes');
	if (addrCustom) address.customAttributes = addrCustom;
	if (isSet(addr.timeZoneId)) address.resolvedTimeZone = { timeZoneId: addr.timeZoneId };

	const hasLat = isSet(addr.latitude);
	const hasLon = isSet(addr.longitude);
	if (hasLat !== hasLon) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Both Latitude and Longitude are required to set coordinates',
			{ itemIndex },
		);
	}
	if (hasLat && hasLon) {
		address.resolvedCoordinates = { lat: Number(addr.latitude), lon: Number(addr.longitude) };
	}

	const phones = ((get('phoneNumbers', {}) as IDataObject).number as IDataObject[]) ?? [];
	if (phones.length) {
		address.phoneNumbers = phones.map((p) => {
			const entry: IDataObject = { value: p.value, type: p.type };
			if (isSet(p.label)) entry.label = p.label;
			return entry;
		});
	}

	const emails = ((get('emailAddresses', {}) as IDataObject).email as IDataObject[]) ?? [];
	if (emails.length) {
		address.emailAddresses = emails.map((e) => {
			const entry: IDataObject = { value: e.value };
			if (isSet(e.recipient)) entry.recipient = e.recipient;
			return entry;
		});
	}

	const body: IDataObject = {
		type: 'SUPPLIER',
		name: get('name') as string,
		address,
	};

	const add = get('supplierAdditionalFields', {}) as IDataObject;
	if (isSet(add.status)) body.status = add.status;
	if (isSet(add.tenantFacilityId)) body.tenantFacilityId = add.tenantFacilityId;
	const facilityCustom = parseJsonParam(ctx, itemIndex, add.customAttributes, 'Custom Attributes');
	if (facilityCustom) body.customAttributes = facilityCustom;

	const tags = ((get('tags', {}) as IDataObject).tag as IDataObject[]) ?? [];
	if (tags.length) body.tags = tags.map((t) => ({ id: t.id, value: t.value }));

	const cost = get('operativeCost', {}) as IDataObject;
	if (isSet(cost.value)) {
		const entry: IDataObject = {
			value: cost.value,
			currency: isSet(cost.currency) ? cost.currency : 'EUR',
		};
		if (isSet(cost.decimalPlaces)) entry.decimalPlaces = cost.decimalPlaces;
		body.operativeCosts = [entry];
	}

	return body;
}

/**
 * Assemble a `ManagedFacilityForModification` PATCH body from the node
 * parameters. `version` is required (optimistic locking); the common scalar
 * fields come from the "Update Fields" collection, and any advanced fields can
 * be supplied via the "Additional Body Fields (JSON)" parameter.
 */
export function buildManagedFacilityForModification(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const updateFields = get('updateFields', {}) as IDataObject;

	// `type` and `version` are both required by ManagedFacilityForModification.
	const body: IDataObject = {
		type: 'MANAGED_FACILITY',
		version: get('version') as number,
	};

	for (const key of [
		'name',
		'status',
		'locationType',
		'tenantFacilityId',
		'fulfillmentProcessBuffer',
		'capacityPlanningTimeframe',
	] as const) {
		if (isSet(updateFields[key])) body[key] = updateFields[key];
	}
	if (updateFields.capacityEnabled !== undefined) body.capacityEnabled = updateFields.capacityEnabled;

	const custom = parseJsonParam(ctx, itemIndex, updateFields.customAttributes, 'Custom Attributes');
	if (custom) body.customAttributes = custom;

	// ----- structured fields (merged before the JSON hatch below) -----
	const ua = get('address', {}) as IDataObject;
	const address = buildAddress(ctx, itemIndex, get, {
		companyName: ua.companyName,
		street: ua.street,
		city: ua.city,
		postalCode: ua.postalCode,
		country: ua.country,
		houseNumber: ua.houseNumber,
		additionalAddressInfo: ua.additionalAddressInfo,
		province: ua.province,
		customAttributes: ua.customAttributes,
		timeZoneId: ua.timeZoneId,
		latitude: ua.latitude,
		longitude: ua.longitude,
	});
	if (Object.keys(address).length) body.address = address;

	const contact = buildContact(ctx, itemIndex, get('contact', {}) as IDataObject);
	if (contact) body.contact = contact;

	const tags = buildTags(get);
	if (tags) body.tags = tags;

	const services = buildServices(get);
	if (services) body.services = services;

	const pickingMethods = buildPickingMethods(get);
	if (pickingMethods) body.pickingMethods = pickingMethods;

	const closingDays = buildClosingDays(get);
	if (closingDays) body.closingDays = closingDays;

	const scanningRule = buildScanningRule(get);
	if (scanningRule) body.scanningRule = scanningRule;

	const pickingTimes = buildPickingTimes(get);
	if (pickingTimes) body.pickingTimes = pickingTimes;

	// ----- JSON hatch (e.g. configs), merged last -----
	const advanced = parseJsonParam(
		ctx,
		itemIndex,
		get('additionalBodyFields', '{}'),
		'Additional Body Fields',
	);
	if (advanced) Object.assign(body, advanced);

	return body;
}
