import {
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_STREAMING_PARAMETER_NAME,
	GONKAGATE_OPTIONS_PARAMETER_NAME,
} from '../../shared/GonkaGate/parameters';

type ChatModelParameterOverrides = {
	model?: string;
	streaming?: boolean;
	options?: Record<string, unknown>;
};

export function createChatModelNodeParameters(
	overrides: ChatModelParameterOverrides = {},
): Record<string, unknown> {
	return {
		[GONKAGATE_MODEL_PARAMETER_NAME]: overrides.model ?? 'test-model',
		[GONKAGATE_STREAMING_PARAMETER_NAME]: overrides.streaming ?? false,
		[GONKAGATE_OPTIONS_PARAMETER_NAME]: overrides.options ?? {},
	};
}
