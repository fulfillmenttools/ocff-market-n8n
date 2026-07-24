import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { isSet } from './FacilityFunctions';

/**
 * Reduce a process response to the most useful fields, for the node's "Simplify"
 * option (a Process carries far more than 10 fields, most of them ref arrays).
 */
export function simplifyProcess(process: IDataObject): IDataObject {
	return {
		id: process.id,
		tenantOrderId: process.tenantOrderId,
		status: process.status,
		operativeStatus: process.operativeStatus,
		domsStatus: process.domsStatus,
		orderRef: process.orderRef,
		facilityRefs: process.facilityRefs,
		documentRefs: process.documentRefs,
		created: process.created,
		lastModified: process.lastModified,
	};
}

/** File name and base64 content, as the API's `NamedFile` schema expects. */
interface NamedFile {
	name: string;
	content: string;
}

/**
 * Read the document file from wherever the user pointed the node: an incoming
 * binary property or a pasted base64 string. Returns undefined when the user
 * chose to send no file at all (only valid when creating a document).
 */
async function resolveNamedFile(
	ctx: IExecuteFunctions,
	itemIndex: number,
): Promise<NamedFile | undefined> {
	// Only the create operation shows "Attach File"; elsewhere a file is mandatory,
	// and the unset parameter falls back to true.
	if (ctx.getNodeParameter('attachFile', itemIndex, true) !== true) return undefined;

	const source = ctx.getNodeParameter('fileSource', itemIndex, 'binary') as string;

	if (source === 'base64') {
		const name = ctx.getNodeParameter('fileName', itemIndex, '') as string;
		const content = ctx.getNodeParameter('fileContent', itemIndex, '') as string;
		if (!isSet(name)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The parameter 'File Name' is empty [item ${itemIndex}]`,
				{ itemIndex, description: 'Enter the file name including its extension, e.g. label.pdf.' },
			);
		}
		if (!isSet(content)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The parameter 'File Content' is empty [item ${itemIndex}]`,
				{ itemIndex, description: 'Paste the base64-encoded contents of the file.' },
			);
		}
		return { name, content };
	}

	const binaryPropertyName = ctx.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string;
	const binaryData = ctx.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	// An explicit File Name wins; otherwise fall back to the binary's own name.
	const overrideName = ctx.getNodeParameter('fileName', itemIndex, '') as string;
	const name = isSet(overrideName) ? overrideName : binaryData.fileName;
	if (!isSet(name)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The file in '${binaryPropertyName}' has no file name [item ${itemIndex}]`,
			{
				itemIndex,
				description:
					"Set the 'File Name' parameter, since the incoming binary data doesn't carry one.",
			},
		);
	}

	return { name: name as string, content: buffer.toString('base64') };
}

/**
 * Assemble an `ExternalDocumentForCreation` body for
 * `POST /api/processes/{processId}/documents`.
 */
export async function buildExternalDocumentForCreation(
	ctx: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const body: IDataObject = {
		type: ctx.getNodeParameter('documentType', itemIndex) as string,
		section: ctx.getNodeParameter('section', itemIndex) as string,
	};

	const options = ctx.getNodeParameter('documentOptions', itemIndex, {}) as IDataObject;
	if (isSet(options.priority)) body.priority = Number(options.priority);

	const file = await resolveNamedFile(ctx, itemIndex);
	if (file) body.file = file;

	return body;
}

/**
 * Assemble an `ExternalDocumentForUpdate` body for
 * `PUT /api/processes/{processId}/documents/{documentId}/file`. Both the file and
 * the current version are required by the schema.
 */
export async function buildExternalDocumentForUpdate(
	ctx: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const file = await resolveNamedFile(ctx, itemIndex);
	if (!file) {
		throw new NodeOperationError(
			ctx.getNode(),
			`A file is required to update a document file [item ${itemIndex}]`,
			{ itemIndex, description: "Choose a binary field or base64 content in 'File Source'." },
		);
	}

	return {
		version: ctx.getNodeParameter('version', itemIndex) as number,
		file,
	};
}

/**
 * Read and validate the Document ID. n8n's `required` flag only guards what the
 * user types, so an expression that resolves to an empty string still has to be
 * caught here rather than reaching the API as a malformed URL.
 */
export function requireDocumentId(ctx: IExecuteFunctions, itemIndex: number): string {
	const documentId = (ctx.getNodeParameter('documentId', itemIndex, '') as string).trim();
	if (!documentId) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The parameter 'Document ID' is empty [item ${itemIndex}]`,
			{
				itemIndex,
				description:
					"Enter the ID of the document to operate on. A process lists its documents under 'documentRefs'.",
			},
		);
	}
	return documentId;
}

/**
 * Derive a download's file name, preferring the `content-disposition` header the
 * API sends and falling back to the document ID plus a type-derived extension.
 */
export function resolveDownloadFileName(headers: IDataObject, documentId: string): string {
	const disposition = (headers['content-disposition'] as string) ?? '';
	const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
	if (match?.[1]) return decodeURIComponent(match[1].trim());

	const mimeType = ((headers['content-type'] as string) ?? '').split(';')[0].trim();
	const extension = mimeType.split('/')[1];
	return extension ? `${documentId}.${extension}` : documentId;
}
