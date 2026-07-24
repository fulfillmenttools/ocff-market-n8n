import type { INodeProperties } from 'n8n-workflow';

const RESOURCE = ['routingplan'];

function show(operation: string[]): { show: { resource: string[]; operation: string[] } } {
	return { show: { resource: RESOURCE, operation } };
}

export const routingPlanOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: RESOURCE } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a single routing plan by ID',
				action: 'Get a routing plan',
			},
			{
				name: 'List',
				value: 'list',
				description: 'Retrieve routing plans, optionally filtered by order reference',
				action: 'List routing plans',
			},
			{
				name: 'List Graphs',
				value: 'listGraphs',
				description: 'Retrieve the routing plans graph for a process',
				action: 'List routing plans graphs',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Find routing plans matching a set of conditions',
				action: 'Search routing plans',
			},
		],
		default: 'search',
	},
];

export const routingPlanFields: INodeProperties[] = [
	// ----- get -----
	{
		displayName: 'Routing Plan ID',
		name: 'routingplanId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(['get']),
		description: 'The routing plan to retrieve',
	},

	// ----- list (by order ref) -----
	{
		displayName: 'Order Ref',
		name: 'orderRef',
		type: 'string',
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(['list']),
		description: 'Optional order reference to filter the routing plans by',
	},

	// ----- list graphs (by process ref) -----
	{
		displayName: 'Process Ref',
		name: 'processRef',
		type: 'string',
		default: '',
		placeholder: 'e.g. 019f37b9-eff2-7398-82a8-d0efc6a50b63',
		displayOptions: show(['listGraphs']),
		description: 'Optional process reference to filter the routing plans graph by',
	},

	// ----- search pagination -----
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: show(['search']),
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: RESOURCE, operation: ['search'], returnAll: [false] } },
		description: 'Max number of results to return',
	},

	// ----- simplify -----
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: false,
		displayOptions: show(['get', 'list', 'search']),
		description: 'Whether to return a simplified version of the response instead of the raw data',
	},
];
