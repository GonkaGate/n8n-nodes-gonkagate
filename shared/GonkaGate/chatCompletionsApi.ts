import type { IDataObject } from 'n8n-workflow';

import type { GonkaGateChatCompletionRequestBody } from './chatCompletionParameters';
import { GONKAGATE_CHAT_COMPLETIONS_PATH } from './constants';
import { GONKAGATE_CHAT_COMPLETION_OPERATION_NAME } from './operationNames';
import { gonkaGateRequest, parseGonkaGateDataObjectResponse } from './request';
import type { GonkaGateRequestOptions } from './transport';

type GonkaGateChatCompletionsRequestContext = Parameters<typeof gonkaGateRequest>[0];

export function createGonkaGateChatCompletionRequestOptions(
	body: GonkaGateChatCompletionRequestBody,
): GonkaGateRequestOptions {
	return {
		method: 'POST',
		url: GONKAGATE_CHAT_COMPLETIONS_PATH,
		body,
	};
}

export async function requestGonkaGateChatCompletionResponse(
	context: GonkaGateChatCompletionsRequestContext,
	body: GonkaGateChatCompletionRequestBody,
	input: {
		itemIndex?: number;
	} = {},
): Promise<IDataObject> {
	return await gonkaGateRequest(
		context,
		GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
		createGonkaGateChatCompletionRequestOptions(body),
		{
			itemIndex: input.itemIndex,
			parseResponse: parseGonkaGateDataObjectResponse,
		},
	);
}
