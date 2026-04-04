import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { buildGonkaGateChatCompletionRequestBodyFromContext } from '../../../shared/GonkaGate/chatCompletionParameters';
import { createGonkaGateChatMessagesProperty } from '../../../shared/GonkaGate/chatMessages';
import { GONKAGATE_CHAT_COMPLETIONS_PATH } from '../../../shared/GonkaGate/constants';
import { GONKAGATE_MODEL_SELECTOR_PROPERTY } from '../../../shared/GonkaGate/modelParameter';
import { GONKAGATE_CHAT_COMPLETION_OPERATION_NAME } from '../../../shared/GonkaGate/operationNames';
import {
	gonkaGateRequest,
	parseGonkaGateDataObjectResponse,
} from '../../../shared/GonkaGate/request';

export const GONKAGATE_CHAT_COMPLETION_OPERATION_ACTION = 'Create a chat completion';

export const GONKAGATE_CHAT_COMPLETION_OPERATION_DESCRIPTION =
	'Send a non-streaming chat completion request to GonkaGate';

export const gonkaGateChatCompletionProperties: readonly INodeProperties[] = [
	GONKAGATE_MODEL_SELECTOR_PROPERTY,
	createGonkaGateChatMessagesProperty(),
] as const;

export async function executeChatCompletion(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const requestBody = buildGonkaGateChatCompletionRequestBodyFromContext(context, itemIndex);

	const response = await gonkaGateRequest(
		context,
		GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
		{
			method: 'POST',
			url: GONKAGATE_CHAT_COMPLETIONS_PATH,
			body: requestBody,
		},
		{
			itemIndex,
			parseResponse: parseGonkaGateDataObjectResponse,
		},
	);

	return [{ json: response }];
}
