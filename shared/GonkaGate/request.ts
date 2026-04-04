import type { IDataObject, INode } from 'n8n-workflow';

import { normalizeGonkaGateError } from './errors';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';
import { buildGonkaGateRequestOptions, type GonkaGateRequestOptions } from './transport';

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

type GonkaGateResponseParser<T> = (response: unknown) => T;

export async function gonkaGateRequest<T extends IDataObject = IDataObject>(
	context: GonkaGateRequestContext,
	operationName: string,
	requestOptions: GonkaGateRequestOptions,
	input: {
		itemIndex?: number;
		parseResponse: GonkaGateResponseParser<T>;
	},
): Promise<T> {
	const { itemIndex = 0, parseResponse } = input;

	try {
		const response = await context.helpers.httpRequestWithAuthentication.call(
			context,
			GONKAGATE_CREDENTIAL_NAME,
			buildGonkaGateRequestOptions(requestOptions),
		);

		return parseResponse(response);
	} catch (error) {
		throw normalizeGonkaGateError(context.getNode(), error, itemIndex, operationName);
	}
}

export function parseGonkaGateDataObjectResponse<T extends IDataObject = IDataObject>(
	response: unknown,
): T {
	if (!isDataObject(response)) {
		throw new Error('GonkaGate response must be a JSON object');
	}

	return response as T;
}

function isDataObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
