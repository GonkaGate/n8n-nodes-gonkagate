import type { IAllExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';

import { buildGonkaGateDefaultHeaders } from './credentials';
import { normalizeGonkaGateError } from './errors';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';

type GonkaGateRequestContext = Pick<IAllExecuteFunctions, 'getNode' | 'helpers'>;

type GonkaGateRequestOptions = IHttpRequestOptions & {
	json?: boolean;
};

export async function gonkaGateRequest<T extends IDataObject = IDataObject>(
	context: GonkaGateRequestContext,
	operationName: string,
	requestOptions: GonkaGateRequestOptions,
	itemIndex = 0,
): Promise<T> {
	const { body, headers, json = true, ...restRequestOptions } = requestOptions;

	try {
		return (await context.helpers.httpRequestWithAuthentication.call(
			context as IAllExecuteFunctions,
			GONKAGATE_CREDENTIAL_NAME,
			{
				...restRequestOptions,
				...(body !== undefined ? { body } : {}),
				json,
				headers: buildGonkaGateDefaultHeaders({
					...(body !== undefined && json ? { 'Content-Type': 'application/json' } : {}),
					...headers,
				}),
			},
		)) as T;
	} catch (error) {
		throw normalizeGonkaGateError(context.getNode(), error, itemIndex, operationName);
	}
}
