import type { INodeProperties } from 'n8n-workflow';

import { createGonkaGateChatModelOptionsProperty } from './chatOptions';
import {
	resolveGonkaGateBaseChatParametersFromContext,
	resolveGonkaGateChatParameters,
	type GonkaGateNodeParameterContext,
	type ResolvedGonkaGateChatParameters,
} from './chatParameters';
import { GONKAGATE_MODEL_SELECTOR_FEATURES } from './modelParameter';
import { GONKAGATE_STREAMING_PARAMETER_NAME } from './parameters';

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
	const baseChatParameters = resolveGonkaGateBaseChatParametersFromContext(context, itemIndex);
	const rawStreaming = context.getNodeParameter(
		GONKAGATE_STREAMING_PARAMETER_NAME,
		itemIndex,
		true,
	) as boolean;

	return resolveGonkaGateChatParameters({
		...baseChatParameters,
		rawStreaming,
	});
}
