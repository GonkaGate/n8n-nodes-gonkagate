import type { GonkaGateChatOptionValues } from '../../shared/GonkaGate/chatOptions';

export const DEFAULT_GONKAGATE_CHAT_MESSAGES_JSON =
	'[\n  {\n    "role": "user",\n    "content": "Hello from n8n"\n  }\n]';

export type GonkaGateChatTestParameterOverrides = {
	model?: string;
	streaming?: boolean;
	options?: GonkaGateChatOptionValues;
	messages?: string;
};

export type GonkaGateChatTestParameters = {
	model: string;
	streaming: boolean;
	options: GonkaGateChatOptionValues;
	messages: string;
};

export function createGonkaGateChatTestParameters(
	overrides: GonkaGateChatTestParameterOverrides = {},
): GonkaGateChatTestParameters {
	return {
		model: overrides.model ?? 'test-model',
		streaming: overrides.streaming ?? false,
		options: overrides.options ?? {},
		messages: overrides.messages ?? DEFAULT_GONKAGATE_CHAT_MESSAGES_JSON,
	};
}
