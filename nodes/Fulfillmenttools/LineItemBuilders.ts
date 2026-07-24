import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

/**
 * Structured-field builders shared by the operative resources (pick jobs and pack
 * jobs) whose payloads reuse the same nested shapes — tags, localized strings,
 * article attributes, recordable attributes, assigned users and transfers.
 *
 * Each reads a fixedCollection value off a source object and returns the API
 * shape, or undefined when the collection is empty.
 */

/** Split a comma-separated string into trimmed, non-empty values. */
export function splitCsv(raw: unknown): string[] {
	if (!isSet(raw)) return [];
	return String(raw)
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}

/** Build a `TagReference[]` from a Tags fixedCollection under `source[collKey]`, or undefined. */
export function buildTags(
	source: IDataObject,
	collKey = 'tags',
	itemKey = 'tag',
): IDataObject[] | undefined {
	const tags = ((source[collKey] as IDataObject)?.[itemKey] as IDataObject[]) ?? [];
	if (!tags.length) return undefined;
	return tags.map((tag) => ({ id: tag.id, value: tag.value }));
}

/** Build a `LocaleString` map from a locale/value fixedCollection, or undefined. */
export function buildLocaleString(raw: unknown): IDataObject | undefined {
	const entries = ((raw as IDataObject)?.translation as IDataObject[]) ?? [];
	const out: IDataObject = {};
	for (const entry of entries) if (isSet(entry.locale)) out[entry.locale as string] = entry.value;
	return Object.keys(out).length ? out : undefined;
}

/** Build an `ArticleAttributeItem[]` from an Attributes fixedCollection, or undefined. */
export function buildArticleAttributes(
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
				`An article attribute is missing its 'Key' or 'Value' [item ${itemIndex}]`,
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

/** Build a `RecordableAttributeForCreation[]` from a fixedCollection, or undefined. */
export function buildRecordableAttributes(
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
		if (isSet(entry.group)) item.group = entry.group;
		if (isSet(entry.value)) item.value = entry.value;
		return item;
	});
}

/** Build the `assignedUsers` array (by userId or username) from a fixedCollection, or undefined. */
export function buildAssignedUsers(source: IDataObject): IDataObject[] | undefined {
	const users = ((source.assignedUsers as IDataObject)?.user as IDataObject[]) ?? [];
	if (!users.length) return undefined;
	const result: IDataObject[] = [];
	for (const user of users) {
		if (isSet(user.userId)) result.push({ userId: user.userId });
		else if (isSet(user.username)) result.push({ username: user.username });
	}
	return result.length ? result : undefined;
}

/** Build the `transfers` array (`OperativeTransfer[]`) from a fixedCollection, or undefined. */
export function buildTransfers(source: IDataObject): IDataObject[] | undefined {
	const transfers = ((source.transfers as IDataObject)?.transfer as IDataObject[]) ?? [];
	if (!transfers.length) return undefined;
	return transfers.map((transfer) => ({ id: transfer.id, type: transfer.type }));
}

/**
 * Build an article object (`AbstractArticle` + attributes) from the flat article
 * fields of a line-item entry. `tenantArticleId` and `title` are required.
 */
export function buildArticle(
	ctx: IExecuteFunctions,
	itemIndex: number,
	entry: IDataObject,
	label = 'line item',
): IDataObject {
	if (!isSet(entry.tenantArticleId) || !isSet(entry.title)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`A ${label} is missing its article 'Tenant Article ID' or 'Title' [item ${itemIndex}]`,
			{ itemIndex, description: `Every ${label} needs an article tenant ID and title.` },
		);
	}
	const article: IDataObject = { tenantArticleId: entry.tenantArticleId, title: entry.title };
	if (isSet(entry.imageUrl)) article.imageUrl = entry.imageUrl;
	if (isSet(entry.weight)) article.weight = Number(entry.weight);
	const titleLocalized = buildLocaleString(entry.titleLocalized);
	if (titleLocalized) article.titleLocalized = titleLocalized;
	const attributes = buildArticleAttributes(ctx, itemIndex, entry);
	if (attributes) article.attributes = attributes;
	const custom = parseJsonParam(ctx, itemIndex, entry.articleCustomAttributes, 'Article Custom Attributes');
	if (custom) article.customAttributes = custom;
	return article;
}

/** Scalar keys of `Address` / `ConsumerAddress` copied straight through. */
const ADDRESS_SCALAR_KEYS = [
	'street',
	'houseNumber',
	'additionalAddressInfo',
	'city',
	'postalCode',
	'province',
	'country',
	'companyName',
	'firstName',
	'lastName',
	'email',
	'salutation',
	'personalTitle',
	'addressType',
] as const;

/**
 * Build a `ConsumerAddress` from an address collection, or undefined if none of
 * its fields are set. Coordinates come from the flat lat/lon fields; phone
 * numbers and address custom attributes come from JSON escape hatches.
 */
export function buildConsumerAddress(
	ctx: IExecuteFunctions,
	itemIndex: number,
	source: IDataObject,
	label: string,
): IDataObject | undefined {
	const address: IDataObject = {};
	for (const key of ADDRESS_SCALAR_KEYS) {
		if (isSet(source[key])) address[key] = source[key];
	}

	const hasLat = isSet(source.latitude);
	const hasLon = isSet(source.longitude);
	if (hasLat !== hasLon) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Both latitude and longitude are required for the ${label} coordinates [item ${itemIndex}]`,
			{ itemIndex },
		);
	}
	if (hasLat && hasLon) {
		address.coordinates = { lat: Number(source.latitude), lon: Number(source.longitude) };
	}

	const phoneNumbers = parseJsonParam(ctx, itemIndex, source.phoneNumbers, `${label} Phone Numbers`);
	if (phoneNumbers && Array.isArray(phoneNumbers)) address.phoneNumbers = phoneNumbers;

	const custom = parseJsonParam(ctx, itemIndex, source.customAttributes, `${label} Custom Attributes`);
	if (custom) address.customAttributes = custom;

	return Object.keys(address).length ? address : undefined;
}

/**
 * Build a `workflowInformation` object from its collection. Returns undefined
 * when nothing is set (for schemas where it is optional); callers that require it
 * default to `{ isAvailable: false }` (WorkflowUnavailable).
 */
export function buildWorkflowInformation(source: IDataObject): IDataObject | undefined {
	if (source.isAvailable === true) {
		const info: IDataObject = { isAvailable: true };
		if (isSet(source.instanceRef)) info.instanceRef = source.instanceRef;
		if (isSet(source.nodeRef)) info.nodeRef = source.nodeRef;
		return info;
	}
	if (source.isAvailable === false) return { isAvailable: false };
	return undefined;
}
