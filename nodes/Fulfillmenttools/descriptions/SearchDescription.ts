import type { INodeProperties } from 'n8n-workflow';

import {
	facilitySearchConfig,
	handoverSearchConfig,
	inboundSearchConfig,
	linkedServiceJobsSearchConfig,
	listingSearchConfig,
	orderSearchConfig,
	packjobSearchConfig,
	parcelSearchConfig,
	pickjobSearchConfig,
	processSearchConfig,
	routingPlanSearchConfig,
	shipmentSearchConfig,
} from '../SearchConfigs';
import type { FilterKind, SearchResourceConfig } from '../SearchFunctions';
import {
	OPERATOR_PARAMS,
	RELATIVE_DATE_OPERATORS,
	TEXT_KINDS,
	enumValueParam,
} from '../SearchFunctions';

/**
 * The Operator dropdown per filter schema, minus its `displayOptions` (which
 * depend on the resource being rendered). Each kind gets its own parameter so
 * users are only offered operators the API supports for the field they picked.
 */
const OPERATOR_PROPERTY: Record<FilterKind, INodeProperties> = {
	string: {
		displayName: 'Operator',
		name: 'stringOperator',
		type: 'options',
		default: 'eq',
		options: [
			{ name: 'Equals', value: 'eq' },
			{ name: 'Is Not One Of', value: 'notIn' },
			{ name: 'Is One Of', value: 'in' },
			{ name: 'Not Equals', value: 'notEq' },
		],
	},
	search: {
		displayName: 'Operator',
		name: 'searchOperator',
		type: 'options',
		default: 'eq',
		options: [
			{ name: 'Equals', value: 'eq' },
			{ name: 'Is Not One Of', value: 'notIn' },
			{ name: 'Is One Of', value: 'in' },
			{ name: 'Matches Regex', value: 'like' },
			{ name: 'Not Equals', value: 'notEq' },
		],
	},
	like: {
		displayName: 'Operator',
		name: 'likeOperator',
		type: 'options',
		default: 'like',
		options: [{ name: 'Matches Regex', value: 'like' }],
	},
	stringEq: {
		displayName: 'Operator',
		name: 'stringEqOperator',
		type: 'options',
		default: 'eq',
		options: [
			{ name: 'Equals', value: 'eq' },
			{ name: 'Not Equals', value: 'notEq' },
		],
	},
	enum: {
		displayName: 'Operator',
		name: 'enumOperator',
		type: 'options',
		default: 'in',
		options: [
			{ name: 'Equals', value: 'eq' },
			{ name: 'Is One Of', value: 'in' },
			{ name: 'Not Equals', value: 'notEq' },
		],
	},
	boolean: {
		displayName: 'Operator',
		name: 'booleanOperator',
		type: 'options',
		default: 'eq',
		options: [
			{ name: 'Equals', value: 'eq' },
			{ name: 'Not Equals', value: 'notEq' },
		],
	},
	number: {
		displayName: 'Operator',
		name: 'numberOperator',
		type: 'options',
		default: 'eq',
		options: [
			{ name: 'Equals', value: 'eq' },
			{ name: 'Greater Than', value: 'gt' },
			{ name: 'Greater Than or Equal', value: 'gte' },
			{ name: 'Is Not One Of', value: 'notIn' },
			{ name: 'Is One Of', value: 'in' },
			{ name: 'Less Than', value: 'lt' },
			{ name: 'Less Than or Equal', value: 'lte' },
			{ name: 'Not Equals', value: 'notEq' },
		],
	},
	date: {
		displayName: 'Operator',
		name: 'dateOperator',
		type: 'options',
		// A range bound is far more useful than equality on a timestamp.
		default: 'gte',
		options: [
			{ name: 'After', value: 'gt' },
			{ name: 'Before', value: 'lt' },
			{ name: 'Equals', value: 'eq' },
			{ name: 'Not Equals', value: 'notEq' },
			{ name: 'On or After', value: 'gte' },
			{ name: 'On or Before', value: 'lte' },
			{
				name: 'Relative: After',
				value: 'after',
				description: 'Compare against a date relative to now',
			},
			{
				name: 'Relative: Before',
				value: 'before',
				description: 'Compare against a date relative to now',
			},
		],
	},
	dateEq: {
		displayName: 'Operator',
		name: 'dateEqOperator',
		type: 'options',
		default: 'eq',
		options: [
			{ name: 'Equals', value: 'eq' },
			{ name: 'Not Equals', value: 'notEq' },
		],
	},
};

/**
 * Build the node properties for the Search operation of one resource.
 *
 * The field registry in `SearchConfigs.ts` is the single source of truth: this
 * derives the "Field" dropdown, one Operator dropdown per filter schema in use,
 * and a matching Value widget per field type (text, multi-select, date or
 * true/false).
 */
export function createSearchFields(config: SearchResourceConfig): INodeProperties[] {
	const showForSearch = {
		show: {
			resource: [config.resource],
			operation: [config.operation ?? 'search'],
		},
	};

	const fieldsOfKind = (...kinds: FilterKind[]): string[] =>
		config.fields.filter((field) => kinds.includes(field.kind)).map((field) => field.value);

	const usedKinds = [...new Set(config.fields.map((field) => field.kind))];
	const enumFields = config.fields.filter((field) => field.kind === 'enum');
	const textFields = fieldsOfKind(...TEXT_KINDS);
	const booleanFields = fieldsOfKind('boolean');
	const numberFields = fieldsOfKind('number');
	const dateFields = fieldsOfKind('date');
	const anyDateFields = fieldsOfKind('date', 'dateEq');
	const supportsCustomAttributeSort = config.sortFields.some(
		(field) => field.value === 'customAttributes',
	);
	const supportsCustomAttributes = config.supportsCustomAttributes !== false;

	// ----- one Operator dropdown per filter schema actually used -----
	const operatorProperties: INodeProperties[] = usedKinds.map((kind) => ({
		...OPERATOR_PROPERTY[kind],
		displayOptions: {
			show: {
				field: fieldsOfKind(kind),
			},
		},
	}));

	// ----- value widgets, one per field type -----
	const valueProperties: INodeProperties[] = [];

	if (textFields.length) {
		valueProperties.push({
			displayName: 'Value',
			name: 'value',
			type: 'string',
			default: '',
			placeholder: 'e.g. automation',
			hint: 'For "Is One Of" and "Is Not One Of", separate multiple values with commas',
			displayOptions: {
				show: {
					field: textFields,
				},
			},
		});
	}

	for (const field of enumFields) {
		valueProperties.push({
			displayName: 'Value',
			name: enumValueParam(field.value),
			type: 'multiOptions',
			default: [],
			displayOptions: {
				show: {
					field: [field.value],
				},
			},
			options: field.enumOptions,
		});
	}

	if (booleanFields.length) {
		valueProperties.push({
			displayName: 'Value',
			name: 'booleanValue',
			type: 'boolean',
			default: false,
			displayOptions: {
				show: {
					field: booleanFields,
				},
			},
		});
	}

	if (numberFields.length) {
		valueProperties.push({
			displayName: 'Value',
			name: 'numberValue',
			type: 'string',
			default: '',
			placeholder: 'e.g. 1200',
			hint: 'For "Is One Of" and "Is Not One Of", separate multiple numbers with commas',
			displayOptions: {
				show: {
					field: numberFields,
				},
			},
		});
	}

	if (anyDateFields.length) {
		valueProperties.push({
			displayName: 'Value',
			name: 'dateValue',
			type: 'dateTime',
			default: '',
			displayOptions: {
				show: {
					field: anyDateFields,
				},
				hide: {
					[OPERATOR_PARAMS.date]: RELATIVE_DATE_OPERATORS,
				},
			},
		});
	}

	if (dateFields.length) {
		valueProperties.push({
			displayName: 'Value',
			name: 'relativeValue',
			type: 'string',
			default: '',
			placeholder: 'e.g. -P1D',
			hint: 'ISO-8601 duration relative to now, prefixed with "-" for the past. -P1D is yesterday, P1W is next week.',
			displayOptions: {
				show: {
					field: dateFields,
					[OPERATOR_PARAMS.date]: RELATIVE_DATE_OPERATORS,
				},
			},
		});
	}

	return [
		{
			displayName: 'Match',
			name: 'matchType',
			type: 'options',
			default: 'and',
			displayOptions: showForSearch,
			description: 'Whether results have to match all or only one of the conditions below',
			options: [
				{
					name: 'All Conditions (AND)',
					value: 'and',
					description: 'Only return results matching every condition',
				},
				{
					name: 'Any Condition (OR)',
					value: 'or',
					description: 'Return results matching at least one condition',
				},
			],
		},
		{
			displayName: 'Conditions',
			name: 'conditions',
			type: 'fixedCollection',
			typeOptions: { multipleValues: true },
			placeholder: 'Add Condition',
			default: {},
			displayOptions: showForSearch,
			description: 'Filters applied to the fields. Leave empty to return everything.',
			options: [
				{
					name: 'condition',
					displayName: 'Condition',
					values: [
						// The default is the first field of this resource's registry; the lint
						// rule only recognises literal defaults, not computed ones.
						// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
						{
							displayName: 'Field',
							name: 'field',
							type: 'options',
							default: config.fields[0].value,
							description: 'The field to filter on',
							options: config.fields.map((field) => ({
								name: field.name,
								value: field.value,
								...(field.description ? { description: field.description } : {}),
							})),
						},
						...operatorProperties,
						...valueProperties,
					],
				},
			],
		},
		...(supportsCustomAttributes ? [customAttributeConditions(showForSearch)] : []),
		{
			displayName: 'Sort',
			name: 'sort',
			type: 'fixedCollection',
			placeholder: 'Add Sort Rule',
			default: {},
			displayOptions: showForSearch,
			description: 'How to order the search result. The API supports a single sort rule.',
			options: [
				{
					name: 'rule',
					displayName: 'Sort Rule',
					values: [
						// The default is the first sort key of this resource's registry; the
						// lint rule only recognises literal defaults, not computed ones.
						// eslint-disable-next-line n8n-nodes-base/node-param-default-missing
						{
							displayName: 'Field',
							name: 'field',
							type: 'options',
							default: config.sortFields[0].value,
							options: config.sortFields.map((field) => ({
								name: field.name,
								value: field.value,
							})),
						},
						...(supportsCustomAttributeSort
							? [
									{
										displayName: 'Custom Attribute Name',
										name: 'customAttribute',
										type: 'string' as const,
										default: '',
										placeholder: 'e.g. suppliesOnlineCustomers',
										displayOptions: {
											show: {
												field: ['customAttributes'],
											},
										},
									},
								]
							: []),
						{
							displayName: 'Direction',
							name: 'direction',
							type: 'options',
							default: 'ASC',
							options: [
								{ name: 'Ascending', value: 'ASC' },
								{ name: 'Descending', value: 'DESC' },
							],
						},
					],
				},
			],
		},
		{
			displayName: 'Additional Query Fields (JSON)',
			name: 'additionalQueryFields',
			type: 'json',
			default: '{}',
			displayOptions: showForSearch,
			description:
				'Advanced: raw JSON merged into the search query for filters not listed above, e.g. nested and/or groups. See the *SearchQuery schemas in the API reference.',
		},
	];
}

/** The "Custom Attribute Conditions" section, for query schemas that expose `customAttributes`. */
function customAttributeConditions(
	displayOptions: INodeProperties['displayOptions'],
): INodeProperties {
	return {
		displayName: 'Custom Attribute Conditions',
		name: 'customAttributeConditions',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Custom Attribute Condition',
		default: {},
		displayOptions,
		description:
			'Filters applied to the free-form custom attributes. Combined with the conditions above using the Match setting.',
		options: [
			{
				name: 'condition',
				displayName: 'Condition',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						required: true,
						default: '',
						placeholder: 'e.g. suppliesOnlineCustomers',
						description:
							'Name of the custom attribute. Must not contain a period or start with a dollar sign.',
					},
					{
						displayName: 'Operator',
						name: 'operator',
						type: 'options',
						default: 'eq',
						options: [
							{ name: 'Equals', value: 'eq' },
							{ name: 'Greater Than', value: 'gt' },
							{ name: 'Greater Than or Equal', value: 'gte' },
							{ name: 'Less Than', value: 'lt' },
							{ name: 'Less Than or Equal', value: 'lte' },
							{ name: 'Not Equals', value: 'notEq' },
						],
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						default: 'string',
						description: 'Data type of the custom attribute',
						options: [
							{ name: 'Boolean', value: 'boolean' },
							{ name: 'Date', value: 'date' },
							{ name: 'Number', value: 'number' },
							{ name: 'String', value: 'string' },
						],
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								type: ['string'],
							},
						},
					},
					{
						displayName: 'Value',
						name: 'booleanValue',
						type: 'boolean',
						default: false,
						displayOptions: {
							show: {
								type: ['boolean'],
							},
						},
					},
					{
						displayName: 'Value',
						name: 'dateValue',
						type: 'dateTime',
						default: '',
						displayOptions: {
							show: {
								type: ['date'],
							},
						},
					},
					{
						displayName: 'Value',
						name: 'numberValue',
						type: 'number',
						default: 0,
						displayOptions: {
							show: {
								type: ['number'],
							},
						},
					},
				],
			},
		],
	};
}

export const facilitySearchFields = createSearchFields(facilitySearchConfig);
export const orderSearchFields = createSearchFields(orderSearchConfig);
export const inboundSearchFields = createSearchFields(inboundSearchConfig);
export const processSearchFields = createSearchFields(processSearchConfig);
export const listingSearchFields = createSearchFields(listingSearchConfig);
export const pickjobSearchFields = createSearchFields(pickjobSearchConfig);
export const packjobSearchFields = createSearchFields(packjobSearchConfig);
export const handoverSearchFields = createSearchFields(handoverSearchConfig);
export const parcelSearchFields = createSearchFields(parcelSearchConfig);
export const shipmentSearchFields = createSearchFields(shipmentSearchConfig);
export const linkedServiceJobsSearchFields = createSearchFields(linkedServiceJobsSearchConfig);
export const routingPlanSearchFields = createSearchFields(routingPlanSearchConfig);
