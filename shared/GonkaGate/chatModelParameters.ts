import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';

import { createGonkaGateChatModelOptionsProperty } from './chatOptions';
import {
	resolveGonkaGateChatParameters,
	type ResolvedGonkaGateChatParameters,
} from './chatParameters';
import { GONKAGATE_MODEL_SELECTOR_FEATURES } from './modelParameter';
import {
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPTIONS_PARAMETER_NAME,
	GONKAGATE_STREAMING_PARAMETER_NAME,
} from './parameters';

type GonkaGateNodeParameterContext = {
	getNode(): INode;
	getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown): unknown;
};

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

export function resolveGonkaGateChatModelParametersFromContext(
	context: GonkaGateNodeParameterContext,
	itemIndex: number,
): ResolvedGonkaGateChatParameters {
	return resolveGonkaGateChatParameters({
		node: context.getNode(),
		rawModel: context.getNodeParameter(GONKAGATE_MODEL_PARAMETER_NAME, itemIndex),
		rawStreaming: context.getNodeParameter(
			GONKAGATE_STREAMING_PARAMETER_NAME,
			itemIndex,
			true,
		) as boolean,
		rawOptions: context.getNodeParameter(GONKAGATE_OPTIONS_PARAMETER_NAME, itemIndex, {}) as IDataObject,
		itemIndex,
	});
}
