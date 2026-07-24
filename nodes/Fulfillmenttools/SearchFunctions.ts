import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet, parseJsonParam } from './FacilityFunctions';

/**
 * Which filter schema a queryable field uses. This decides both the operators the
 * API accepts for it and the widget the UI renders for its value:
 * - `string`   → StringFilter: eq, notEq, in, notIn
 * - `search`   → StringSearchFilter: the above plus `like` (regex)
 * - `like`     → SearchFilter: `like` only (full-text search fields)
 * - `stringEq` → StringEqFilter: eq, notEq
 * - `enum`     → *EnumFilter: eq, notEq, in
 * - `boolean`  → BooleanFilter: eq, notEq
 * - `number`   → NumberFilter: eq, notEq, in, notIn, gt, gte, lt, lte
 * - `date`     → DateFilter: eq, notEq, gt, gte, lt, lte and the relative
 *                `before` / `after` operators
 * - `dateEq`   → DateEqFilter: eq, notEq
 */
export type FilterKind =
	| 'string'
	| 'search'
	| 'like'
	| 'stringEq'
	| 'enum'
	| 'boolean'
	| 'number'
	| 'date'
	| 'dateEq';

export interface SearchFieldDef {
	/** Title-case label shown in the "Field" dropdown. */
	name: string;
	/** Stable value stored in the workflow. */
	value: string;
	description?: string;
	kind: FilterKind;
	/** Path within the search query where the filter object is placed. */
	path: readonly string[];
	/**
	 * Cross-entity (`referenced`) filters are only supported at the top level of a
	 * query, so they can never be nested inside an `and` / `or` group.
	 */
	topLevelOnly?: boolean;
	/** Selectable values, required for (and only used by) `enum` fields. */
	enumOptions?: Array<{ name: string; value: string; description?: string }>;
}

export interface SearchSortDef {
	name: string;
	value: string;
	/**
	 * Path within the sort object. Omitted for the `customAttributes` entry, whose
	 * key is entered by the user.
	 */
	path?: readonly string[];
}

/** Everything needed to render and execute the Search operation of one resource. */
export interface SearchResourceConfig {
	/** Resource value this search belongs to, e.g. `facility`. */
	resource: string;
	/**
	 * Operation value the search fields are shown for. Defaults to `search`; set it
	 * when one resource has more than one search operation (e.g. the Shipment
	 * resource searches both parcels and shipments).
	 */
	operation?: string;
	/** Search endpoint, e.g. `/api/facilities/search`. */
	endpoint: string;
	/** Property of the paginated result holding the items, e.g. `facilities`. */
	propertyName: string;
	fields: readonly SearchFieldDef[];
	sortFields: readonly SearchSortDef[];
	/**
	 * Whether the query schema exposes `customAttributes`. Set to false to drop the
	 * "Custom Attribute Conditions" section (e.g. `ProcessSearchQuery` has none).
	 */
	supportsCustomAttributes?: boolean;
}

/** Operators accepted per filter schema. */
export const ALLOWED_OPERATORS: Record<FilterKind, readonly string[]> = {
	string: ['eq', 'notEq', 'in', 'notIn'],
	search: ['eq', 'notEq', 'in', 'notIn', 'like'],
	like: ['like'],
	stringEq: ['eq', 'notEq'],
	enum: ['eq', 'notEq', 'in'],
	boolean: ['eq', 'notEq'],
	number: ['eq', 'notEq', 'in', 'notIn', 'gt', 'gte', 'lt', 'lte'],
	date: ['eq', 'notEq', 'gt', 'gte', 'lt', 'lte', 'before', 'after'],
	dateEq: ['eq', 'notEq'],
};

/**
 * Each filter kind gets its own Operator parameter so the dropdown only offers
 * operators the API actually supports for the selected field.
 */
export const OPERATOR_PARAMS: Record<FilterKind, string> = {
	string: 'stringOperator',
	search: 'searchOperator',
	like: 'likeOperator',
	stringEq: 'stringEqOperator',
	enum: 'enumOperator',
	boolean: 'booleanOperator',
	number: 'numberOperator',
	date: 'dateOperator',
	dateEq: 'dateEqOperator',
};

/** Date operators whose value is an ISO-8601 duration relative to now, not a date. */
export const RELATIVE_DATE_OPERATORS = ['before', 'after'];

/** Kinds whose value is entered in the shared free-text `value` parameter. */
export const TEXT_KINDS: readonly FilterKind[] = ['string', 'search', 'like', 'stringEq'];

/**
 * Parameter name holding the value of an `enum` field. Derived from the field so
 * every enum gets its own dropdown of allowed values, e.g. `services.type` →
 * `servicesTypeValue`.
 */
export function enumValueParam(fieldValue: string): string {
	const parts = fieldValue.split(/[^a-zA-Z0-9]+/).filter(Boolean);
	return (
		parts
			.map((part, index) =>
				index === 0
					? part.charAt(0).toLowerCase() + part.slice(1)
					: part.charAt(0).toUpperCase() + part.slice(1),
			)
			.join('') + 'Value'
	);
}

/** Operators accepted per custom attribute type (BooleanFilter / StringEqFilter / …). */
const ALLOWED_CUSTOM_ATTRIBUTE_OPERATORS: Record<string, readonly string[]> = {
	string: ['eq', 'notEq'],
	boolean: ['eq', 'notEq'],
	number: ['eq', 'notEq', 'gt', 'gte', 'lt', 'lte'],
	date: ['eq', 'notEq', 'gt', 'gte', 'lt', 'lte'],
};

/** Wrap `leaf` in nested objects along `path`, e.g. ['a','b'] → { a: { b: leaf } }. */
function nest(path: readonly string[], leaf: unknown): IDataObject {
	return path.reduceRight<unknown>((acc, key) => ({ [key]: acc }), leaf) as IDataObject;
}

/** Deep-merge `source` into `target`, so sibling paths such as two address filters combine. */
function deepMerge(target: IDataObject, source: IDataObject): IDataObject {
	for (const [key, value] of Object.entries(source)) {
		const existing = target[key];
		if (
			existing &&
			typeof existing === 'object' &&
			!Array.isArray(existing) &&
			value &&
			typeof value === 'object' &&
			!Array.isArray(value)
		) {
			deepMerge(existing as IDataObject, value as IDataObject);
		} else {
			target[key] = value;
		}
	}
	return target;
}

/** Split a comma-separated list parameter into trimmed, non-empty values. */
function splitList(raw: string): string[] {
	return raw
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}

/**
 * Turn a single UI condition into the search query fragment for it, e.g.
 * `{ address: { city: { like: 'Ham.*' } } }`.
 */
function buildCondition(
	ctx: IExecuteFunctions,
	itemIndex: number,
	condition: IDataObject,
	definition: SearchFieldDef,
): IDataObject {
	const operator = condition[OPERATOR_PARAMS[definition.kind]] as string;
	if (!ALLOWED_OPERATORS[definition.kind].includes(operator)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The operator in 'Operator' is not supported for the selected 'Field' [item ${itemIndex}]`,
			{
				itemIndex,
				description: `The field '${definition.name}' supports: ${ALLOWED_OPERATORS[
					definition.kind
				].join(', ')}.`,
			},
		);
	}

	const isList = operator === 'in' || operator === 'notIn';
	let value: unknown;

	if (definition.kind === 'enum') {
		const selected = (condition[enumValueParam(definition.value)] as string[]) ?? [];
		if (!selected.length) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The parameter 'Value' is empty for the condition on '${definition.name}' [item ${itemIndex}]`,
				{ itemIndex, description: 'Select at least one value, or remove the condition.' },
			);
		}
		value = isList ? selected : selected[0];
	} else if (definition.kind === 'boolean') {
		value = condition.booleanValue === true;
	} else if (definition.kind === 'number') {
		// The value is a free-text field so that comma-separated lists (for in /
		// notIn) and expressions work; every entry is parsed to a number here.
		const raw = (condition.numberValue as string) ?? '';
		const parts = isList ? splitList(raw) : [raw.trim()];
		const numbers = parts.map((part) => {
			const parsed = Number(part);
			if (part === '' || Number.isNaN(parsed)) {
				throw new NodeOperationError(
					ctx.getNode(),
					`The parameter 'Value' for the condition on '${definition.name}' is not a number [item ${itemIndex}]`,
					{ itemIndex, description: 'Enter a numeric value, e.g. 1200.' },
				);
			}
			return parsed;
		});
		value = isList ? numbers : numbers[0];
	} else if (definition.kind === 'date' || definition.kind === 'dateEq') {
		value = RELATIVE_DATE_OPERATORS.includes(operator)
			? condition.relativeValue
			: condition.dateValue;
	} else {
		const raw = (condition.value as string) ?? '';
		if (isList) {
			const values = splitList(raw);
			if (!values.length) {
				throw new NodeOperationError(
					ctx.getNode(),
					`The parameter 'Value' is empty for the condition on '${definition.name}' [item ${itemIndex}]`,
					{ itemIndex, description: 'Enter one or more comma-separated values.' },
				);
			}
			value = values;
		} else {
			value = raw;
		}
	}

	if (definition.kind !== 'boolean' && !Array.isArray(value) && !isSet(value)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The parameter 'Value' is empty for the condition on '${definition.name}' [item ${itemIndex}]`,
			{ itemIndex, description: 'Enter a value to filter on, or remove the condition.' },
		);
	}

	return nest(definition.path, { [operator]: value });
}

/**
 * Turn a single UI custom attribute condition into a query fragment, e.g.
 * `{ customAttributes: { suppliesOnlineCustomers: { eq: true } } }`.
 */
function buildCustomAttributeCondition(
	ctx: IExecuteFunctions,
	itemIndex: number,
	condition: IDataObject,
): IDataObject {
	const name = ((condition.name as string) ?? '').trim();
	if (!name) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The parameter 'Name' is empty for a custom attribute condition [item ${itemIndex}]`,
			{ itemIndex, description: 'Enter the name of the custom attribute to filter on.' },
		);
	}
	if (name.includes('.') || name.startsWith('$')) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The custom attribute name "${name}" in 'Name' cannot be searched [item ${itemIndex}]`,
			{
				itemIndex,
				description:
					'The search API rejects attribute names that contain a period or start with a dollar sign.',
			},
		);
	}

	const type = (condition.type as string) ?? 'string';
	const operator = condition.operator as string;
	if (!(ALLOWED_CUSTOM_ATTRIBUTE_OPERATORS[type] ?? []).includes(operator)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The operator in 'Operator' is not supported for the selected 'Type' [item ${itemIndex}]`,
			{
				itemIndex,
				description: 'Text and true/false attributes only support Equals and Not Equals.',
			},
		);
	}

	let value: unknown;
	if (type === 'boolean') {
		value = condition.booleanValue === true;
	} else if (type === 'number') {
		value = Number(condition.numberValue);
	} else if (type === 'date') {
		value = condition.dateValue;
	} else {
		value = condition.value;
	}

	if (type !== 'boolean' && !isSet(value)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The parameter 'Value' is empty for the custom attribute "${name}" [item ${itemIndex}]`,
			{ itemIndex, description: 'Enter a value to filter on, or remove the condition.' },
		);
	}

	return { customAttributes: { [name]: { [operator]: value } } };
}

/** Build the `sort` array from the Sort fixedCollection, or undefined if unset. */
function buildSort(
	ctx: IExecuteFunctions,
	itemIndex: number,
	rule: IDataObject,
	config: SearchResourceConfig,
): IDataObject[] | undefined {
	const field = rule.field as string;
	if (!isSet(field)) return undefined;

	const direction = (rule.direction as string) ?? 'ASC';

	const definition = config.sortFields.find((entry) => entry.value === field);
	if (!definition) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The field "${field}" in 'Sort' cannot be sorted by [item ${itemIndex}]`,
			{ itemIndex, description: 'Pick one of the fields offered in the "Field" dropdown.' },
		);
	}

	if (field === 'customAttributes') {
		const attribute = ((rule.customAttribute as string) ?? '').trim();
		if (!attribute) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The parameter 'Custom Attribute Name' is empty [item ${itemIndex}]`,
				{ itemIndex, description: 'Enter the custom attribute to sort by, or pick another field.' },
			);
		}
		return [{ customAttributes: { [attribute]: direction } }];
	}

	if (!definition.path) {
		throw new NodeOperationError(ctx.getNode(), `Unknown sort field "${field}"`, {
			itemIndex,
			description: 'Pick one of the fields offered in the "Field" dropdown.',
		});
	}
	return [nest(definition.path, direction)];
}

/**
 * Assemble a `{ query, sort? }` search payload (without pagination, which the
 * request helper adds) from the node parameters for a single input item.
 */
export function buildSearchPayload(
	ctx: IExecuteFunctions,
	itemIndex: number,
	config: SearchResourceConfig,
): IDataObject {
	const get = (name: string, fallback?: unknown): unknown =>
		ctx.getNodeParameter(name, itemIndex, fallback);

	const matchType = (get('matchType', 'and') as string) === 'or' ? 'or' : 'and';

	const conditions = ((get('conditions', {}) as IDataObject).condition as IDataObject[]) ?? [];
	const customAttributeConditions =
		((get('customAttributeConditions', {}) as IDataObject).condition as IDataObject[]) ?? [];

	// Cross-entity filters must sit at the query root, everything else is grouped.
	const rootFragments: IDataObject[] = [];
	const groupedFragments: IDataObject[] = [];

	for (const condition of conditions) {
		const fieldValue = condition.field as string;
		const definition = config.fields.find((entry) => entry.value === fieldValue);
		if (!definition) {
			throw new NodeOperationError(ctx.getNode(), `Unknown search field "${fieldValue}"`, {
				itemIndex,
				description: 'Pick one of the fields offered in the "Field" dropdown.',
			});
		}
		const fragment = buildCondition(ctx, itemIndex, condition, definition);
		(definition.topLevelOnly ? rootFragments : groupedFragments).push(fragment);
	}
	for (const condition of customAttributeConditions) {
		groupedFragments.push(buildCustomAttributeCondition(ctx, itemIndex, condition));
	}

	const query: IDataObject = {};
	for (const fragment of rootFragments) {
		deepMerge(query, fragment);
	}

	// A single condition doesn't need an and/or wrapper; more than one does, so
	// that two filters on the same field don't overwrite each other.
	if (groupedFragments.length === 1) {
		deepMerge(query, groupedFragments[0]);
	} else if (groupedFragments.length > 1) {
		query[matchType] = groupedFragments;
	}

	const additionalQuery = parseJsonParam(
		ctx,
		itemIndex,
		get('additionalQueryFields', '{}'),
		'Additional Query Fields',
	);
	if (additionalQuery) deepMerge(query, additionalQuery);

	const payload: IDataObject = { query };

	const sortRule = (get('sort', {}) as IDataObject).rule as IDataObject | undefined;
	if (sortRule) {
		const sort = buildSort(ctx, itemIndex, sortRule, config);
		if (sort) payload.sort = sort;
	}

	return payload;
}
