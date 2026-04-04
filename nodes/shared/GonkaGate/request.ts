import type {
	IAllExecuteFunctions,
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	ISupplyDataFunctions,
} from 'n8n-workflow';

import { normalizeGonkaGateError } from './errors';

type GonkaGateRequestContext = IExecuteFunctions | ILoadOptionsFunctions | ISupplyDataFunctions;

export async function gonkaGateRequest<T extends IDataObject = IDataObject>(
	context: GonkaGateRequestContext,
	operationName: string,
	requestOptions: IHttpRequestOptions,
	itemIndex = 0,
): Promise<T> {
	try {
		return (await context.helpers.httpRequestWithAuthentication.call(
			context as IAllExecuteFunctions,
			'gonkaGateApi',
			{
				json: true,
				...requestOptions,
				headers: {
					Accept: 'application/json',
					...(requestOptions.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
					...requestOptions.headers,
				},
			},
		)) as T;
	} catch (error) {
		throw normalizeGonkaGateError(context.getNode(), error, itemIndex, operationName);
	}
}
