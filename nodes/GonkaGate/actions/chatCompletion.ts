import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { GONKAGATE_CHAT_COMPLETIONS_PATH } from '../../shared/GonkaGate/constants';
import {
	buildGonkaGateChatCompletionRequestBody,
	createGonkaGateModelSelectorProperty,
} from '../../shared/GonkaGate';
import { gonkaGateRequest } from '../../shared/GonkaGate/request';
import { createGonkaGateJsonOutput } from '../operations';

export const gonkaGateChatCompletionProperties: readonly INodeProperties[] = [
	createGonkaGateModelSelectorProperty(),
	{
		displayName: 'Messages (JSON)',
		name: 'messages',
		type: 'json',
		default: '[\n  {\n    "role": "user",\n    "content": "Hello from n8n"\n  }\n]',
		required: true,
		description:
			'OpenAI-compatible chat messages sent to POST /v1/chat/completions. GonkaGate-specific advanced extensions stay out of the MVP surface for now.',
	},
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
