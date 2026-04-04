import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import {
	buildGonkaGateChatCompletionRequestBody,
	createGonkaGateChatMessagesProperty,
} from '../../../shared/GonkaGate/chatParameters';
import { GONKAGATE_CHAT_COMPLETIONS_PATH } from '../../../shared/GonkaGate/constants';
import { createGonkaGateModelSelectorProperty } from '../../../shared/GonkaGate/modelParameter';
import { gonkaGateRequest } from '../../../shared/GonkaGate/request';
import { createGonkaGateJsonOutput } from '../output';

export const gonkaGateChatCompletionProperties: readonly INodeProperties[] = [
	createGonkaGateModelSelectorProperty(),
	createGonkaGateChatMessagesProperty(),
] as const;

export async function executeChatCompletion(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const requestBody = buildGonkaGateChatCompletionRequest(context, itemIndex);

	const response = await gonkaGateRequest(
		context,
		'Chat Completion',
		{
			method: 'POST',
			url: GONKAGATE_CHAT_COMPLETIONS_PATH,
			body: requestBody,
		},
		itemIndex,
	);

	return createGonkaGateJsonOutput(response);
}

function buildGonkaGateChatCompletionRequest(
	context: IExecuteFunctions,
	itemIndex: number,
): Record<string, unknown> {
	return buildGonkaGateChatCompletionRequestBody({
		node: context.getNode(),
		rawModel: context.getNodeParameter('model', itemIndex),
		rawMessages: context.getNodeParameter('messages', itemIndex),
		rawStreaming: false,
		itemIndex,
	});
}
