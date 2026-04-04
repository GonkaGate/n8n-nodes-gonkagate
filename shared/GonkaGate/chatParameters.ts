import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';

import {
	createGonkaGateChatModelOptionsProperty,
	resolveGonkaGateChatOptions,
	type GonkaGateChatOptionValues,
} from './chatOptions';
import { createGonkaGateChatMessagesProperty, parseGonkaGateChatMessages } from './chatMessages';
import { resolveGonkaGateModelId } from './modelId';

export { createGonkaGateChatModelOptionsProperty, createGonkaGateChatMessagesProperty };

export type ResolvedGonkaGateChatParameters = {
	model: string;
	stream: boolean;
	requestBodyOptions: GonkaGateChatOptionValues;
	aiModelOptions: GonkaGateChatOptionValues;
};

export function createGonkaGateStreamingProperty(): INodeProperties {
	return {
		displayName: 'Enable Streaming',
		name: 'streaming',
		type: 'boolean',
		default: true,
		description:
			'Whether n8n AI workflows should use GonkaGate SSE streaming on /v1/chat/completions when the surrounding workflow path supports visible live streaming',
	};
}

export function resolveGonkaGateChatParameters(input: {
	node: INode;
	rawModel: unknown;
	rawStreaming: boolean;
	rawOptions?: IDataObject;
	itemIndex: number;
}): ResolvedGonkaGateChatParameters {
	return {
		model: resolveGonkaGateModelId(input.node, input.rawModel, input.itemIndex),
		stream: input.rawStreaming,
		requestBodyOptions: resolveGonkaGateChatOptions(input.rawOptions, 'requestBody'),
		aiModelOptions: resolveGonkaGateChatOptions(input.rawOptions, 'aiModel'),
	};
}

export function buildGonkaGateChatCompletionRequestBody(input: {
	node: INode;
	rawModel: unknown;
	rawMessages: unknown;
	rawStreaming: boolean;
	rawOptions?: IDataObject;
	itemIndex: number;
}): IDataObject {
	const parameters = resolveGonkaGateChatParameters({
		node: input.node,
		rawModel: input.rawModel,
		rawStreaming: input.rawStreaming,
		rawOptions: input.rawOptions,
		itemIndex: input.itemIndex,
	});

	return {
		model: parameters.model,
		messages: parseGonkaGateChatMessages(input.node, input.rawMessages, input.itemIndex),
		stream: parameters.stream,
		...parameters.requestBodyOptions,
	};
}
