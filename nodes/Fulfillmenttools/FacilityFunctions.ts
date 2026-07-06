import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

function parseJsonParam(
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

function isSet(value: unknown): boolean {
	return value !== undefined && value !== null && value !== '';
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
	const address: IDataObject = {
		companyName: get('companyName') as string,
		street: get('street') as string,
		city: get('city') as string,
		postalCode: get('postalCode') as string,
		country: get('country') as string,
	};

	const houseNumber = get('houseNumber', '') as string;
	if (isSet(houseNumber)) address.houseNumber = houseNumber;

	const addr = get('addressAdditionalFields', {}) as IDataObject;
	for (const key of ['additionalAddressInfo', 'province'] as const) {
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
	const contact = get('contact', {}) as IDataObject;
	if (isSet(contact.firstName) || isSet(contact.lastName)) {
		if (!isSet(contact.firstName) || !isSet(contact.lastName)) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Contact requires both First Name and Last Name',
				{ itemIndex },
			);
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
		body.contact = c;
	}

	// ----- tags -----
	const tags = ((get('tags', {}) as IDataObject).tag as IDataObject[]) ?? [];
	if (tags.length) body.tags = tags.map((t) => ({ id: t.id, value: t.value }));

	// ----- services & picking methods -----
	const services = (get('services', []) as string[]) ?? [];
	if (services.length) body.services = services.map((type) => ({ type }));

	const pickingMethods = (get('pickingMethods', []) as string[]) ?? [];
	if (pickingMethods.length) body.pickingMethods = pickingMethods;

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
	const closingDays = ((get('closingDays', {}) as IDataObject).day as IDataObject[]) ?? [];
	if (closingDays.length) {
		body.closingDays = closingDays.map((d) => ({
			date: d.date,
			reason: d.reason,
			recurrence: d.recurrence,
		}));
	}

	// ----- scanning rule -----
	const scanningRules = ((get('scanningRules', {}) as IDataObject).rule as IDataObject[]) ?? [];
	if (scanningRules.length) {
		body.scanningRule = {
			values: scanningRules.map((r) => ({
				scanningRuleType: r.scanningRuleType,
				priority: Number(r.priority),
			})),
		};
	}

	// ----- picking times (grouped per weekday) -----
	const ranges = ((get('pickingTimes', {}) as IDataObject).range as IDataObject[]) ?? [];
	if (ranges.length) {
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
		body.pickingTimes = pickingTimes;
	}

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
	const updateFields = ctx.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const body: IDataObject = {
		version: ctx.getNodeParameter('version', itemIndex) as number,
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

	const advanced = parseJsonParam(
		ctx,
		itemIndex,
		ctx.getNodeParameter('additionalBodyFields', itemIndex, '{}'),
		'Additional Body Fields',
	);
	if (advanced) Object.assign(body, advanced);

	return body;
}
