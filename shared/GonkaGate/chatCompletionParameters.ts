import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';

import { parseGonkaGateChatMessages, createGonkaGateChatMessagesProperty } from './chatMessages';
import {
	resolveGonkaGateChatParameters,
	type ResolvedGonkaGateChatParameters,
} from './chatParameters';
import { GONKAGATE_MODEL_SELECTOR_FEATURES } from './modelParameter';
import {
	GONKAGATE_MESSAGES_PARAMETER_NAME,
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPTIONS_PARAMETER_NAME,
} from './parameters';

type GonkaGateNodeParameterContext = {
	getNode(): INode;
	getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown): unknown;
};

export const gonkaGateChatCompletionProperties: readonly INodeProperties[] = [
	GONKAGATE_MODEL_SELECTOR_FEATURES.property,
	createGonkaGateChatMessagesProperty(),
] as const;

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

	return toGonkaGateChatCompletionRequestBody(parameters, {
		node: input.node,
		rawMessages: input.rawMessages,
		itemIndex: input.itemIndex,
	});
}

export function buildGonkaGateChatCompletionRequestBodyFromContext(
	context: GonkaGateNodeParameterContext,
	itemIndex: number,
): IDataObject {
	const rawModel = context.getNodeParameter(GONKAGATE_MODEL_PARAMETER_NAME, itemIndex);
	const rawMessages = context.getNodeParameter(GONKAGATE_MESSAGES_PARAMETER_NAME, itemIndex);
	const rawOptions = context.getNodeParameter(GONKAGATE_OPTIONS_PARAMETER_NAME, itemIndex, {}) as IDataObject;
	const parameters = resolveGonkaGateChatParameters({
		node: context.getNode(),
		rawModel,
		rawStreaming: false,
		rawOptions,
		itemIndex,
	});

	return toGonkaGateChatCompletionRequestBody(parameters, {
		node: context.getNode(),
		rawMessages,
		itemIndex,
	});
}

function toGonkaGateChatCompletionRequestBody(
	parameters: ResolvedGonkaGateChatParameters,
	input: {
		node: INode;
		rawMessages: unknown;
		itemIndex: number;
	},
): IDataObject {
	return {
		model: parameters.model,
		messages: parseGonkaGateChatMessages(input.node, input.rawMessages, input.itemIndex),
		stream: parameters.stream,
		...parameters.requestBodyOptions,
	};
}
