import type { GonkaGateChatOptionValues } from '../../shared/GonkaGate/chatOptions';
import {
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPTIONS_PARAMETER_NAME,
	GONKAGATE_STREAMING_PARAMETER_NAME,
} from '../../shared/GonkaGate/parameters';
import { createGonkaGateChatTestParameters } from './createGonkaGateChatParameters';

type ChatModelParameterOverrides = {
	model?: string;
	streaming?: boolean;
	options?: GonkaGateChatOptionValues;
};

export type ChatModelNodeParameters = {
	[GONKAGATE_MODEL_PARAMETER_NAME]: string;
	[GONKAGATE_STREAMING_PARAMETER_NAME]: boolean;
	[GONKAGATE_OPTIONS_PARAMETER_NAME]: GonkaGateChatOptionValues;
};

export function createChatModelNodeParameters(
	overrides: ChatModelParameterOverrides = {},
): ChatModelNodeParameters {
	const chatParameters = createGonkaGateChatTestParameters(overrides);

	return {
		[GONKAGATE_MODEL_PARAMETER_NAME]: chatParameters.model,
		[GONKAGATE_STREAMING_PARAMETER_NAME]: chatParameters.streaming,
		[GONKAGATE_OPTIONS_PARAMETER_NAME]: chatParameters.options,
	};
}
