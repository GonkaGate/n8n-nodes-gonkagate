import type { IDataObject, INode } from 'n8n-workflow';

import { parseGonkaGateChatMessages, type GonkaGateChatMessage } from './chatMessages';
import {
	resolveGonkaGateChatParameters,
	resolveGonkaGateChatParametersFromContext,
	type GonkaGateNodeParameterContext,
	type ResolvedGonkaGateChatParameters,
} from './chatParameters';
import { GONKAGATE_MESSAGES_PARAMETER_NAME } from './parameters';

export type GonkaGateChatCompletionRequestBody = IDataObject & {
	model: string;
	messages: GonkaGateChatMessage[];
	stream: boolean;
};

export function buildGonkaGateChatCompletionRequestBody(input: {
	node: INode;
	rawModel: unknown;
	rawMessages: unknown;
	rawStreaming: unknown;
	rawOptions?: unknown;
	itemIndex: number;
}): GonkaGateChatCompletionRequestBody {
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
): GonkaGateChatCompletionRequestBody {
	const node = context.getNode();
	const rawMessages = context.getNodeParameter(GONKAGATE_MESSAGES_PARAMETER_NAME, itemIndex);
	const parameters = resolveGonkaGateChatParametersFromContext(context, itemIndex, {
		rawStreaming: false,
	});

	return toGonkaGateChatCompletionRequestBody(parameters, {
		node,
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
): GonkaGateChatCompletionRequestBody {
	return {
		model: parameters.model,
		messages: parseGonkaGateChatMessages(input.node, input.rawMessages, input.itemIndex),
		stream: parameters.stream,
		...parameters.requestBodyOptions,
	};
}
