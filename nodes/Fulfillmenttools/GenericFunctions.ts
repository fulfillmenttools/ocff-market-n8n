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

/**
 * Download a binary file from fulfillmenttools (the `…/file` endpoints).
 *
 * Unlike the JSON helper this asks for the raw bytes and the full response, so
 * the caller can pick up the `content-type` and `content-disposition` headers
 * needed to build n8n binary data.
 */
export async function fulfillmenttoolsApiRequestFile(
	this: IExecuteFunctions,
	endpoint: string,
): Promise<{ body: Buffer; headers: IDataObject }> {
	const credentials = await this.getCredentials('fulfillmenttoolsApi');
	const baseUrl = (credentials.apiUrl as string).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${baseUrl}${endpoint}`,
		encoding: 'arraybuffer',
		returnFullResponse: true,
		json: false,
	};

	try {
		const response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'fulfillmenttoolsApi',
			options,
		)) as { body: Buffer | ArrayBuffer; headers: IDataObject };

		return {
			body: Buffer.isBuffer(response.body) ? response.body : Buffer.from(response.body),
			headers: response.headers ?? {},
		};
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/** Largest page size the fulfillmenttools search endpoints accept. */
const SEARCH_MAX_PAGE_SIZE = 250;

/**
 * Run a fulfillmenttools search endpoint (`POST /api/{entity}/search`) and collect
 * its results across pages.
 *
 * Search endpoints are cursor-paginated: the response carries a `pageInfo` with
 * `hasNextPage` and an `endCursor` that is passed back as the `after` field of the
 * next request. Pass a `limit` to stop early, or omit it to fetch everything.
 */
export async function fulfillmenttoolsSearchRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	endpoint: string,
	propertyName: string,
	payload: IDataObject,
	limit?: number,
): Promise<IDataObject[]> {
	const returnData: IDataObject[] = [];
	let after: string | undefined;

	do {
		const remaining = limit === undefined ? SEARCH_MAX_PAGE_SIZE : limit - returnData.length;
		const body: IDataObject = {
			...payload,
			size: Math.min(SEARCH_MAX_PAGE_SIZE, remaining),
		};
		if (after) body.after = after;

		const response = (await fulfillmenttoolsApiRequest.call(
			this,
			'POST',
			endpoint,
			body,
		)) as IDataObject;

		const items = (response[propertyName] as IDataObject[]) ?? [];
		returnData.push(...items);

		const pageInfo = (response.pageInfo as IDataObject) ?? {};
		if (!items.length || pageInfo.hasNextPage !== true) break;
		after = pageInfo.endCursor as string | undefined;
	} while (after && (limit === undefined || returnData.length < limit));

	return limit === undefined ? returnData : returnData.slice(0, limit);
}
