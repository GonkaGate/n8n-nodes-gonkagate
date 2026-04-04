import type { IDataObject, IHttpRequestOptions, INode } from 'n8n-workflow';

import { buildGonkaGateDefaultHeaders } from './credentials';
import { normalizeGonkaGateError } from './errors';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';

type GonkaGateRequestContext = {
	getNode(): INode;
	helpers: {
		httpRequestWithAuthentication(
			this: unknown,
			credentialType: string,
			requestOptions: GonkaGateRequestOptions,
		): Promise<unknown>;
	};
};

export type GonkaGateRequestOptions = IHttpRequestOptions & {
	json?: boolean;
};

export function buildGonkaGateRequestOptions(
	requestOptions: GonkaGateRequestOptions,
): GonkaGateRequestOptions {
	const { body, headers, json = true, ...restRequestOptions } = requestOptions;
	const normalizedHeaders = (headers ?? {}) as Record<string, string>;

	return {
		...restRequestOptions,
		...(body !== undefined ? { body } : {}),
		json,
		headers: buildGonkaGateDefaultHeaders({
			...(body !== undefined && json ? { 'Content-Type': 'application/json' } : {}),
			...normalizedHeaders,
		}),
	};
}

export async function gonkaGateRequest<T extends IDataObject = IDataObject>(
	context: GonkaGateRequestContext,
	operationName: string,
	requestOptions: GonkaGateRequestOptions,
	itemIndex = 0,
): Promise<T> {
	try {
		return (await context.helpers.httpRequestWithAuthentication.call(
			context,
			GONKAGATE_CREDENTIAL_NAME,
			buildGonkaGateRequestOptions(requestOptions),
		)) as T;
	} catch (error) {
		throw normalizeGonkaGateError(context.getNode(), error, itemIndex, operationName);
	}
}
