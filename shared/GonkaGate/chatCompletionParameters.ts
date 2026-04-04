import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';

import { parseGonkaGateChatMessages, createGonkaGateChatMessagesProperty } from './chatMessages';
import {
	resolveGonkaGateBaseChatParametersFromContext,
	resolveGonkaGateChatParameters,
	type GonkaGateNodeParameterContext,
	type ResolvedGonkaGateChatParameters,
} from './chatParameters';
import { GONKAGATE_MODEL_SELECTOR_FEATURES } from './modelParameter';
import { GONKAGATE_MESSAGES_PARAMETER_NAME } from './parameters';

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
	const baseChatParameters = resolveGonkaGateBaseChatParametersFromContext(context, itemIndex);
	const rawMessages = context.getNodeParameter(GONKAGATE_MESSAGES_PARAMETER_NAME, itemIndex);
	const parameters = resolveGonkaGateChatParameters({
		...baseChatParameters,
		rawStreaming: false,
	});

	return toGonkaGateChatCompletionRequestBody(parameters, {
		node: baseChatParameters.node,
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
