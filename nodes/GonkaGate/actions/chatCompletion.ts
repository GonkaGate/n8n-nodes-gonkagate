import type { IDataObject, IExecuteFunctions, INode, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { GONKAGATE_CHAT_COMPLETIONS_PATH } from '../../shared/GonkaGate/constants';
import {
	resolveGonkaGateModelId,
	createGonkaGateModelSelectorProperty,
} from '../../shared/GonkaGate/models';
import { gonkaGateRequest } from '../../shared/GonkaGate/request';

const CHAT_MESSAGES_EXAMPLE =
	'Provide an array of OpenAI-compatible chat message objects, for example [{"role":"user","content":"Hello from n8n"}].';

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
): Promise<IDataObject> {
	const requestBody = buildGonkaGateChatCompletionRequest(context, itemIndex);

	return await gonkaGateRequest(
		context,
		'Chat Completion',
		{
			method: 'POST',
			url: GONKAGATE_CHAT_COMPLETIONS_PATH,
			body: requestBody,
		},
		itemIndex,
	);
}

function buildGonkaGateChatCompletionRequest(
	context: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	return {
		model: resolveGonkaGateModelId(
			context.getNode(),
			context.getNodeParameter('model', itemIndex),
			itemIndex,
		),
		messages: parseChatMessages(
			context.getNode(),
			context.getNodeParameter('messages', itemIndex),
			itemIndex,
		),
		stream: false,
	};
}

function parseChatMessages(node: INode, rawMessages: unknown, itemIndex: number): IDataObject[] {
	let messages = rawMessages;

	if (typeof messages === 'string') {
		try {
			messages = JSON.parse(messages);
		} catch (error) {
			throw new NodeOperationError(node, error as Error, {
				itemIndex,
				message: 'Messages must be valid JSON',
				description: CHAT_MESSAGES_EXAMPLE,
			});
		}
	}

	if (!Array.isArray(messages) || messages.length === 0) {
		throw new NodeOperationError(node, 'Messages must be a non-empty array', {
			itemIndex,
			description: CHAT_MESSAGES_EXAMPLE,
		});
	}

	for (const message of messages) {
		if (!isMessageObject(message)) {
			throw new NodeOperationError(node, 'Each message must be a JSON object', {
				itemIndex,
			});
		}

		if (typeof message.role !== 'string' || message.role.trim().length === 0) {
			throw new NodeOperationError(node, 'Each message must include a role', {
				itemIndex,
			});
		}
	}

	return messages;
}

function isMessageObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
