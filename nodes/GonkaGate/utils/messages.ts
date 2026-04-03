import type { IDataObject, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export function parseChatMessages(
	node: INode,
	rawMessages: unknown,
	itemIndex: number,
): IDataObject[] {
	let messages = rawMessages;

	if (typeof messages === 'string') {
		try {
			messages = JSON.parse(messages);
		} catch (error) {
			throw new NodeOperationError(node, error as Error, {
				itemIndex,
				message: 'Messages must be valid JSON',
				description:
					'Provide an array of OpenAI-compatible chat message objects, for example [{"role":"user","content":"Hello from n8n"}].',
			});
		}
	}

	if (!Array.isArray(messages) || messages.length === 0) {
		throw new NodeOperationError(node, 'Messages must be a non-empty array', {
			itemIndex,
			description:
				'Provide an array of OpenAI-compatible chat message objects, for example [{"role":"user","content":"Hello from n8n"}].',
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
