import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';

import {
	createGonkaGateChatModelOptionsProperty,
	resolveGonkaGateChatOptions,
	type GonkaGateChatOptionValues,
} from './chatOptions';
import { createGonkaGateChatMessagesProperty, parseGonkaGateChatMessages } from './chatMessages';
import { resolveGonkaGateModelId } from './modelId';
import {
	GONKAGATE_MESSAGES_PARAMETER_NAME,
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPTIONS_PARAMETER_NAME,
	GONKAGATE_STREAMING_PARAMETER_NAME,
} from './parameters';
import { GONKAGATE_MODEL_SELECTOR_FEATURES } from './modelParameter';

export { createGonkaGateChatModelOptionsProperty, createGonkaGateChatMessagesProperty };

export type ResolvedGonkaGateChatParameters = {
	model: string;
	stream: boolean;
	requestBodyOptions: GonkaGateChatOptionValues;
	aiModelOptions: GonkaGateChatOptionValues;
};

export const gonkaGateChatCompletionProperties: readonly INodeProperties[] = [
	GONKAGATE_MODEL_SELECTOR_FEATURES.property,
	createGonkaGateChatMessagesProperty(),
] as const;

export const gonkaGateChatModelProperties: readonly INodeProperties[] = [
	GONKAGATE_MODEL_SELECTOR_FEATURES.property,
	createGonkaGateStreamingProperty(),
	createGonkaGateChatModelOptionsProperty(),
] as const;

export function createGonkaGateStreamingProperty(): INodeProperties {
	return {
		displayName: 'Enable Streaming',
		name: GONKAGATE_STREAMING_PARAMETER_NAME,
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

type GonkaGateNodeParameterContext = {
	getNode(): INode;
	getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown): unknown;
};

export function resolveGonkaGateChatParametersFromContext(
	context: GonkaGateNodeParameterContext,
	itemIndex: number,
): ResolvedGonkaGateChatParameters {
	const values = getGonkaGateChatContextValues(context, itemIndex, {
		includeOptions: true,
		includeStreaming: true,
		defaultStreaming: true,
	});

	return resolveGonkaGateChatParameters({
		node: context.getNode(),
		rawModel: values.rawModel,
		rawStreaming: values.rawStreaming,
		rawOptions: values.rawOptions,
		itemIndex,
	});
}

export function buildGonkaGateChatCompletionRequestBodyFromContext(
	context: GonkaGateNodeParameterContext,
	itemIndex: number,
): IDataObject {
	const values = getGonkaGateChatContextValues(context, itemIndex, {
		includeMessages: true,
		defaultStreaming: false,
	});

	return buildGonkaGateChatCompletionRequestBody({
		node: context.getNode(),
		rawModel: values.rawModel,
		rawMessages: values.rawMessages,
		rawStreaming: values.rawStreaming,
		rawOptions: values.rawOptions,
		itemIndex,
	});
}

function getGonkaGateChatContextValues(
	context: GonkaGateNodeParameterContext,
	itemIndex: number,
	input: {
		includeMessages?: boolean;
		includeOptions?: boolean;
		includeStreaming?: boolean;
		defaultStreaming: boolean;
	},
): {
	rawModel: unknown;
	rawMessages?: unknown;
	rawOptions?: IDataObject;
	rawStreaming: boolean;
} {
	return {
		rawModel: context.getNodeParameter(GONKAGATE_MODEL_PARAMETER_NAME, itemIndex),
		rawMessages: input.includeMessages
			? context.getNodeParameter(GONKAGATE_MESSAGES_PARAMETER_NAME, itemIndex)
			: undefined,
		rawOptions: input.includeOptions
			? (context.getNodeParameter(GONKAGATE_OPTIONS_PARAMETER_NAME, itemIndex, {}) as IDataObject)
			: undefined,
		rawStreaming: input.includeStreaming
			? (context.getNodeParameter(
					GONKAGATE_STREAMING_PARAMETER_NAME,
					itemIndex,
					input.defaultStreaming,
				) as boolean)
			: input.defaultStreaming,
	};
}
