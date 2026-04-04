import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { GONKAGATE_MESSAGES_PARAMETER_NAME } from './parameters';

const CHAT_MESSAGES_EXAMPLE =
	'Provide an array of OpenAI-compatible chat message objects, for example [{"role":"user","content":"Hello from n8n"}].';

export type GonkaGateChatMessage = IDataObject & {
	role: string;
};

export function createGonkaGateChatMessagesProperty(): INodeProperties {
	return {
		displayName: 'Messages (JSON)',
		name: GONKAGATE_MESSAGES_PARAMETER_NAME,
		type: 'json',
		default: '[\n  {\n    "role": "user",\n    "content": "Hello from n8n"\n  }\n]',
		required: true,
		description:
			'OpenAI-compatible chat messages sent to POST /v1/chat/completions. GonkaGate-specific advanced extensions stay out of the MVP surface for now.',
	};
}

export function parseGonkaGateChatMessages(
	node: INode,
	rawMessages: unknown,
	itemIndex: number,
): GonkaGateChatMessage[] {
	let messages = rawMessages;

	if (typeof messages === 'string') {
		try {
			messages = JSON.parse(messages);
		} catch (error) {
			const parseError =
				error instanceof Error ? error : new Error('Messages must be valid JSON');

			throw new NodeOperationError(node, parseError, {
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

	return messages.map((message) => toGonkaGateChatMessage(node, message, itemIndex));
}

function toGonkaGateChatMessage(
	node: INode,
	value: unknown,
	itemIndex: number,
): GonkaGateChatMessage {
	if (!isMessageObject(value)) {
		throw new NodeOperationError(node, 'Each message must be a JSON object', {
			itemIndex,
		});
	}

	if (typeof value.role !== 'string' || value.role.trim().length === 0) {
		throw new NodeOperationError(node, 'Each message must include a role', {
			itemIndex,
		});
	}

	return {
		...value,
		role: value.role,
	};
}

function isMessageObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
