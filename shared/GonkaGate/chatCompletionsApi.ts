import type { IDataObject } from 'n8n-workflow';

import type { GonkaGateChatCompletionRequestBody } from './chatCompletionParameters';
import { GONKAGATE_CHAT_COMPLETIONS_PATH } from './constants';
import { GONKAGATE_CHAT_COMPLETION_OPERATION_NAME } from './operationNames';
import { createGonkaGateEndpointRequester, parseGonkaGateDataObjectResponse } from './request';
import type { GonkaGateRequestOptions } from './transport';

export function createGonkaGateChatCompletionRequestOptions(
	body: GonkaGateChatCompletionRequestBody,
): GonkaGateRequestOptions {
	return {
		method: 'POST',
		url: GONKAGATE_CHAT_COMPLETIONS_PATH,
		body,
	};
}

const requestGonkaGateChatCompletionEndpoint = createGonkaGateEndpointRequester<IDataObject>({
	operationName: GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
	parseResponse: parseGonkaGateDataObjectResponse,
});

type GonkaGateChatCompletionsRequestContext = Parameters<
	typeof requestGonkaGateChatCompletionEndpoint
>[0];

export async function requestGonkaGateChatCompletionResponse(
	context: GonkaGateChatCompletionsRequestContext,
	body: GonkaGateChatCompletionRequestBody,
	input: {
		itemIndex?: number;
	} = {},
): Promise<IDataObject> {
	return await requestGonkaGateChatCompletionEndpoint(
		context,
		createGonkaGateChatCompletionRequestOptions(body),
		{
			itemIndex: input.itemIndex,
		},
	);
}
