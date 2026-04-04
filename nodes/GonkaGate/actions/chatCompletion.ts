import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { buildGonkaGateChatCompletionRequestBodyFromContext } from '../../../shared/GonkaGate/chatCompletionParameters';
import { requestGonkaGateChatCompletionResponse } from '../../../shared/GonkaGate/chatCompletionsApi';
import { createGonkaGateChatMessagesProperty } from '../../../shared/GonkaGate/chatMessages';
import { GONKAGATE_MODEL_SELECTOR_PROPERTY } from '../../../shared/GonkaGate/modelParameter';
import { executeGonkaGateJsonAction } from './executeJsonAction';

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

	return await executeGonkaGateJsonAction(async () =>
		requestGonkaGateChatCompletionResponse(context, requestBody, {
			itemIndex,
		}),
	);
}
