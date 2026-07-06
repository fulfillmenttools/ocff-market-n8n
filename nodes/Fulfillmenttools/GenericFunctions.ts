import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Shared request helper for all fulfillmenttools resources.
 *
 * Builds the request against the tenant base URL taken from the credential and
 * delegates authentication (token exchange + Bearer header) to the
 * `fulfillmenttoolsApi` credential via `httpRequestWithAuthentication`.
 *
 * Add new resources/operations in the node's `execute` router — they can all
 * reuse this function.
 */
export async function fulfillmenttoolsApiRequest<T = IDataObject>(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject | IDataObject[] = {},
	qs: IDataObject = {},
): Promise<T> {
	const credentials = await this.getCredentials('fulfillmenttoolsApi');
	const baseUrl = (credentials.apiUrl as string).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		body,
		qs,
		json: true,
		headers: {
			'Content-Type': 'application/json',
		},
	};

	if (Array.isArray(body) ? body.length === 0 : Object.keys(body).length === 0) {
		delete options.body;
	}
	if (Object.keys(qs).length === 0) {
		delete options.qs;
	}

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'fulfillmenttoolsApi',
			options,
		)) as T;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Retrieve every page of a cursor-paginated fulfillmenttools list endpoint.
 *
 * The list endpoints return `{ [propertyName]: item[], total }` and page via a
 * `startAfterId` query param set to the last item's `id`. Iterates until a page
 * returns fewer items than the page size.
 */
export async function fulfillmenttoolsApiRequestAllItems(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	endpoint: string,
	propertyName: string,
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	const pageSize = 100;
	qs.size = pageSize;

	let items: IDataObject[];
	do {
		const response = (await fulfillmenttoolsApiRequest.call(
			this,
			'GET',
			endpoint,
			{},
			qs,
		)) as IDataObject;
		items = (response[propertyName] as IDataObject[]) ?? [];
		returnData.push(...items);
		if (items.length) {
			qs.startAfterId = items[items.length - 1].id as string;
		}
	} while (items.length === pageSize);

	return returnData;
}
