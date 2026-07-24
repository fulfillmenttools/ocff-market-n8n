import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

/**
 * Reduce a listing response to the most useful fields, for the node's "Simplify"
 * option (a Listing carries far more than 10 fields).
 */
export function simplifyListing(listing: IDataObject): IDataObject {
	return {
		id: listing.id,
		tenantArticleId: listing.tenantArticleId,
		title: listing.title,
		status: listing.status,
		facilityId: listing.facilityId,
		outOfStockBehaviour: listing.outOfStockBehaviour,
		measurementUnitKey: listing.measurementUnitKey,
		version: listing.version,
		created: listing.created,
		lastModified: listing.lastModified,
	};
}

/** Split a comma-separated string parameter into trimmed, non-empty values. */
function splitList(raw: unknown): string[] {
	if (!isSet(raw)) return [];
	return String(raw)
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}

/** Build a `TagReference[]` from a Tags fixedCollection, or undefined if empty. */
function buildTags(source: IDataObject): IDataObject[] | undefined {
	const tags = ((source.tags as IDataObject)?.tag as IDataObject[]) ?? [];
	if (!tags.length) return undefined;
	return tags.map((tag) => ({ id: tag.id, value: tag.value }));
}

/**
 * Build a `LocaleString` (a `{ [locale]: value }` map) from a localized-text
 * fixedCollection, or undefined if no translations were entered.
 */
function buildLocaleString(raw: unknown): IDataObject | undefined {
	const entries = ((raw as IDataObject)?.translation as IDataObject[]) ?? [];
	const localeString: IDataObject = {};
	for (const entry of entries) {
		if (isSet(entry.locale)) localeString[entry.locale as string] = entry.value;
	}
	return Object.keys(localeString).length ? localeString : undefined;
}

/**
 * Build a `ListingAttributeItem[]` from an Attributes fixedCollection, or
 * undefined if empty. `key` and `value` are required by the API.
 */
function buildAttributes(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const attributes = ((source.attributes as IDataObject)?.attribute as IDataObject[]) ?? [];
	if (!attributes.length) return undefined;
	return attributes.map((attribute) => {
		if (!isSet(attribute.key) || !isSet(attribute.value)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`An attribute is missing its 'Key' or 'Value' [item ${itemIndex}]`,
				{ itemIndex, description: 'Every attribute needs both a key and a value.' },
			);
		}
		const item: IDataObject = { key: attribute.key, value: attribute.value };
		if (isSet(attribute.type)) item.type = attribute.type;
		if (isSet(attribute.category)) item.category = attribute.category;
		if (isSet(attribute.priority)) item.priority = Number(attribute.priority);
		return item;
	});
}

/** Build a `ScanningRuleConfiguration` from a Scanning Rules fixedCollection, or undefined if empty. */
function buildScanningRule(source: IDataObject): IDataObject | undefined {
	const rules = ((source.scanningRule as IDataObject)?.rule as IDataObject[]) ?? [];
	if (!rules.length) return undefined;
	return {
		values: rules.map((rule) => ({
			scanningRuleType: rule.scanningRuleType,
			priority: Number(rule.priority),
		})),
	};
}

/**
 * Build the `stockProperties` map (`{ [key]: StockPropertyDefinition }`) from a
 * Stock Properties fixedCollection, or undefined if empty.
 */
function buildStockProperties(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject | undefined {
	const props = ((source.stockProperties as IDataObject)?.property as IDataObject[]) ?? [];
	if (!props.length) return undefined;
	const map: IDataObject = {};
	for (const prop of props) {
		if (!isSet(prop.key)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`A stock property is missing its 'Key' [item ${itemIndex}]`,
				{ itemIndex, description: 'Every stock property needs a key.' },
			);
		}
		const definition: IDataObject = {
			inputType: prop.inputType,
			required: prop.required === true,
		};
		if (isSet(prop.defaultValue)) definition.defaultValue = prop.defaultValue;
		map[prop.key as string] = definition;
	}
	return map;
}

/**
 * Build a `ListingRecordableAttributeForCreation[]` from a Recordable Attributes
 * fixedCollection, or undefined if empty. The localized key is entered as a
 * single locale + value pair (the common case); multi-locale keys go through the
 * JSON escape hatch.
 */
function buildRecordableAttributes(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
): IDataObject[] | undefined {
	const entries =
		((source.recordableAttributes as IDataObject)?.attribute as IDataObject[]) ?? [];
	if (!entries.length) return undefined;
	return entries.map((entry) => {
		if (!isSet(entry.keyLocale) || !isSet(entry.localizedKey)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`A recordable attribute is missing its 'Key Locale' or 'Localized Key' [item ${itemIndex}]`,
				{ itemIndex, description: 'Every recordable attribute needs a localized key.' },
			);
		}
		const item: IDataObject = {
			keyLocalized: { [entry.keyLocale as string]: entry.localizedKey },
			recordingRule: isSet(entry.recordingRule) ? entry.recordingRule : 'OPTIONAL',
		};
		if (isSet(entry.value)) item.value = entry.value;
		return item;
	});
}

/** Build a `AvailableUntilDefinition` from the flat stock-available-until fields, or undefined. */
function buildStockAvailableUntil(source: IDataObject): IDataObject | undefined {
	if (!isSet(source.stockAvailableUntilBase)) return undefined;
	const definition: IDataObject = { calculationBase: source.stockAvailableUntilBase };
	if (isSet(source.stockAvailableUntilModifier)) {
		definition.modifier = source.stockAvailableUntilModifier;
	}
	return definition;
}

/** Build an `OutOfStockConfig` from the flat preorder / restock fields, or undefined. */
function buildOutOfStockConfig(source: IDataObject): IDataObject | undefined {
	const config: IDataObject = {};
	if (isSet(source.preorderAvailabilityStart)) {
		config.preorder = { availabilityTimeframe: { start: source.preorderAvailabilityStart } };
	}
	if (isSet(source.restockableInDays) && Number(source.restockableInDays) > 0) {
		config.restock = { restockableInDays: Number(source.restockableInDays) };
	}
	return Object.keys(config).length ? config : undefined;
}

/**
 * Copy the scalar and structured listing fields shared by every write operation
 * (create per facility, bulk upsert, and the modify action of a patch) from a
 * source parameter object onto `target`. Only fields the user actually set are
 * written, so a patch never clears an untouched field.
 */
function applyListingFields(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
	target: IDataObject,
): void {
	for (const key of ['title', 'imageUrl', 'measurementUnitKey', 'status', 'outOfStockBehaviour'] as const) {
		if (isSet(source[key])) target[key] = source[key];
	}

	const categoryRefs = splitList(source.categoryRefs);
	if (categoryRefs.length) target.categoryRefs = categoryRefs;

	const scannableCodes = splitList(source.scannableCodes);
	if (scannableCodes.length) target.scannableCodes = scannableCodes;

	const tags = buildTags(source);
	if (tags) target.tags = tags;

	const titleLocalized = buildLocaleString(source.titleLocalized);
	if (titleLocalized) target.titleLocalized = titleLocalized;

	const attributes = buildAttributes(ctx, itemIndex, source);
	if (attributes) target.attributes = attributes;

	if (isSet(source.legalHsCode)) target.legal = { hsCode: source.legalHsCode };

	const scanningRule = buildScanningRule(source);
	if (scanningRule) target.scanningRule = scanningRule;

	const stockProperties = buildStockProperties(ctx, itemIndex, source);
	if (stockProperties) target.stockProperties = stockProperties;

	const recordableAttributes = buildRecordableAttributes(ctx, itemIndex, source);
	if (recordableAttributes) target.recordableAttributes = recordableAttributes;

	const stockAvailableUntil = buildStockAvailableUntil(source);
	if (stockAvailableUntil) target.stockAvailableUntil = stockAvailableUntil;

	const outOfStockConfig = buildOutOfStockConfig(source);
	if (outOfStockConfig) target.outOfStockConfig = outOfStockConfig;

	const byContexts = parseJsonParam(
		ctx,
		itemIndex,
		source.outOfStockBehaviourByContexts,
		'Out Of Stock Behaviour By Contexts',
	);
	if (byContexts && Array.isArray(byContexts)) target.outOfStockBehaviourByContexts = byContexts;

	const customAttributes = parseJsonParam(
		ctx,
		itemIndex,
		source.customAttributes,
		'Custom Attributes',
	);
	if (customAttributes) target.customAttributes = customAttributes;

	const advanced = parseJsonParam(ctx, itemIndex, source.additionalFields, 'Additional Fields');
	if (advanced) Object.assign(target, advanced);
}

/**
 * Build a `ListingsForReplacement` body for
 * `PUT /api/facilities/{facilityId}/listings` from the Listings fixedCollection.
 * Each entry is a `ListingForReplacement`; `tenantArticleId` is required.
 */
export function buildListingsForReplacement(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	const entries =
		((ctx.getNodeParameter('listings', itemIndex, {}) as IDataObject).listing as IDataObject[]) ??
		[];
	if (!entries.length) {
		throw new NodeOperationError(ctx.getNode(), `No listings provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one listing under 'Listings'.",
		});
	}

	const listings = entries.map((entry) => {
		if (!isSet(entry.tenantArticleId)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`A listing is missing its 'Tenant Article ID' [item ${itemIndex}]`,
				{ itemIndex, description: 'Every listing needs a tenant article ID.' },
			);
		}
		const listing: IDataObject = { tenantArticleId: entry.tenantArticleId };
		if (isSet(entry.version)) listing.version = Number(entry.version);
		applyListingFields(ctx, itemIndex, entry, listing);
		return listing;
	});

	return { listings };
}

/**
 * Build a `ListingBulkUpsertPayload` body for `PUT /api/listings`. Each entry
 * targets facilities either by one or more selectors (`MULTI_SELECTOR`) or a
 * single facility (`SINGLE_FACILITY`); the discriminator is `targetingStrategy`.
 */
export function buildListingBulkUpsert(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const entries =
		((ctx.getNodeParameter('listings', itemIndex, {}) as IDataObject).listing as IDataObject[]) ??
		[];
	if (!entries.length) {
		throw new NodeOperationError(ctx.getNode(), `No listings provided [item ${itemIndex}]`, {
			itemIndex,
			description: "Add at least one listing under 'Listings'.",
		});
	}

	const listings = entries.map((entry) => {
		for (const key of ['tenantArticleId', 'title'] as const) {
			if (!isSet(entry[key])) {
				throw new NodeOperationError(
					ctx.getNode(),
					`A listing is missing its '${key === 'title' ? 'Title' : 'Tenant Article ID'}' [item ${itemIndex}]`,
					{ itemIndex, description: 'Every bulk-upsert listing needs a tenant article ID and title.' },
				);
			}
		}

		const targetingStrategy = (entry.targetingStrategy as string) ?? 'SINGLE_FACILITY';
		const listing: IDataObject = {
			tenantArticleId: entry.tenantArticleId,
			title: entry.title,
			targetingStrategy,
		};

		if (targetingStrategy === 'SINGLE_FACILITY') {
			listing.facility = buildFacilitySelector(ctx, itemIndex, entry);
			if (isSet(entry.version)) listing.version = Number(entry.version);
		} else {
			const selector = parseJsonParam(ctx, itemIndex, entry.selector, 'Selector');
			if (!selector || !Array.isArray(selector)) {
				throw new NodeOperationError(
					ctx.getNode(),
					`The 'Selector' of a MULTI_SELECTOR listing must be a JSON array [item ${itemIndex}]`,
					{
						itemIndex,
						description:
							'Provide an array of facility selectors, e.g. [{"facility":{"facilityRef":"..."}}].',
					},
				);
			}
			listing.selector = selector;
		}

		applyListingFields(ctx, itemIndex, entry, listing);
		return listing;
	});

	return { listings };
}

/** Build a `FacilityRefSelector` / `TenantFacilityIdSelector` from an entry's facility fields. */
function buildFacilitySelector(
	ctx: IExecuteFunctions,
	itemIndex: number,
	entry: IDataObject,
): IDataObject {
	if (isSet(entry.facilityRef)) return { facilityRef: entry.facilityRef };
	if (isSet(entry.tenantFacilityId)) return { tenantFacilityId: entry.tenantFacilityId };
	throw new NodeOperationError(
		ctx.getNode(),
		`A single-facility listing needs a facility reference [item ${itemIndex}]`,
		{
			itemIndex,
			description: "Set either 'Facility Ref' or 'Tenant Facility ID' on the listing.",
		},
	);
}

/**
 * Build a `ListingPatchActions` body for
 * `PATCH /api/facilities/{facilityId}/listings/{tenantArticleId}`. The common
 * update fields are wrapped in a single `ModifyListing` action; extra actions can
 * be supplied via the JSON escape hatch.
 */
export function buildListingPatchActions(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const updateFields = ctx.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

	const action: IDataObject = { action: 'ModifyListing' };
	applyListingFields(ctx, itemIndex, updateFields, action);
	if (isSet(updateFields.subtitle)) action.subtitle = updateFields.subtitle;

	const actions: IDataObject[] = [];
	// Only add the ModifyListing action if the user set at least one field on it.
	if (Object.keys(action).length > 1) actions.push(action);

	const extraActions = parseJsonParam(
		ctx,
		itemIndex,
		ctx.getNodeParameter('additionalActions', itemIndex, '[]'),
		'Additional Actions',
	);
	if (extraActions && Array.isArray(extraActions)) actions.push(...(extraActions as IDataObject[]));

	if (!actions.length) {
		throw new NodeOperationError(ctx.getNode(), `No changes to apply [item ${itemIndex}]`, {
			itemIndex,
			description: "Set at least one field under 'Update Fields' or add a raw action.",
		});
	}

	return {
		version: ctx.getNodeParameter('version', itemIndex) as number,
		actions,
	};
}
