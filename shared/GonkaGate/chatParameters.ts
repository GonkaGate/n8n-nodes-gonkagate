import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { resolveGonkaGateModelId } from './modelId';

const CHAT_MESSAGES_EXAMPLE =
	'Provide an array of OpenAI-compatible chat message objects, for example [{"role":"user","content":"Hello from n8n"}].';

type GonkaGateChatOptionTarget = 'requestBody' | 'aiModel';

export type GonkaGateChatOptionKey =
	| 'frequencyPenalty'
	| 'maxRetries'
	| 'maxTokens'
	| 'presencePenalty'
	| 'temperature'
	| 'timeout'
	| 'topP';

const GONKAGATE_CHAT_OPTION_KEYS: readonly GonkaGateChatOptionKey[] = [
	'frequencyPenalty',
	'maxRetries',
	'maxTokens',
	'presencePenalty',
	'temperature',
	'timeout',
	'topP',
];

const GONKAGATE_CHAT_OPTION_TARGETS: Record<
	GonkaGateChatOptionKey,
	readonly GonkaGateChatOptionTarget[]
> = {
	frequencyPenalty: ['requestBody', 'aiModel'],
	maxRetries: ['aiModel'],
	maxTokens: ['requestBody', 'aiModel'],
	presencePenalty: ['requestBody', 'aiModel'],
	temperature: ['requestBody', 'aiModel'],
	timeout: ['aiModel'],
	topP: ['requestBody', 'aiModel'],
};

const GONKAGATE_CHAT_OPTION_PROPERTIES: Record<GonkaGateChatOptionKey, INodeProperties> = {
	frequencyPenalty: {
		displayName: 'Frequency Penalty',
		name: 'frequencyPenalty',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: -2,
			maxValue: 2,
			numberPrecision: 1,
		},
		description: 'Reduce repetition by penalizing tokens based on prior frequency',
	},
	maxRetries: {
		displayName: 'Max Retries',
		name: 'maxRetries',
		type: 'number',
		default: 2,
		typeOptions: {
			minValue: 0,
		},
		description: 'Maximum number of retry attempts for transient upstream failures',
	},
	maxTokens: {
		displayName: 'Maximum Number of Tokens',
		name: 'maxTokens',
		type: 'number',
		default: 1024,
		typeOptions: {
			minValue: 1,
		},
		description: 'Upper bound for completion tokens when the selected model supports it',
	},
	presencePenalty: {
		displayName: 'Presence Penalty',
		name: 'presencePenalty',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: -2,
			maxValue: 2,
			numberPrecision: 1,
		},
		description: 'Encourage the model to introduce new topics instead of staying repetitive',
	},
	temperature: {
		displayName: 'Sampling Temperature',
		name: 'temperature',
		type: 'number',
		default: 0.7,
		typeOptions: {
			minValue: 0,
			maxValue: 2,
			numberPrecision: 1,
		},
		description: 'Controls randomness. Higher values generally produce more varied output.',
	},
	timeout: {
		displayName: 'Timeout',
		name: 'timeout',
		type: 'number',
		default: 60000,
		typeOptions: {
			minValue: 1,
		},
		description: 'Maximum request time in milliseconds',
	},
	topP: {
		displayName: 'Top P',
		name: 'topP',
		type: 'number',
		default: 1,
		typeOptions: {
			minValue: 0,
			maxValue: 1,
			numberPrecision: 2,
		},
		description: 'Controls nucleus sampling. Lower values make outputs more conservative.',
	},
};

type GonkaGateChatOptionValues = Partial<Record<GonkaGateChatOptionKey, number>>;

export type ResolvedGonkaGateChatParameters = {
	model: string;
	stream: boolean;
	requestBodyOptions: GonkaGateChatOptionValues;
	aiModelOptions: GonkaGateChatOptionValues;
};

export function createGonkaGateChatMessagesProperty(): INodeProperties {
	return {
		displayName: 'Messages (JSON)',
		name: 'messages',
		type: 'json',
		default: '[\n  {\n    "role": "user",\n    "content": "Hello from n8n"\n  }\n]',
		required: true,
		description:
			'OpenAI-compatible chat messages sent to POST /v1/chat/completions. GonkaGate-specific advanced extensions stay out of the MVP surface for now.',
	};
}

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

export function createGonkaGateChatModelOptionsProperty(): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description:
			'Optional chat-completions settings. This node keeps Responses API mode off and targets GonkaGate chat completions only.',
		options: GONKAGATE_CHAT_OPTION_KEYS.filter((key) =>
			supportsChatOptionTarget(key, 'aiModel'),
		).map((key) => GONKAGATE_CHAT_OPTION_PROPERTIES[key]),
	};
}

function buildGonkaGateChatOptions(
	options: IDataObject,
	target: GonkaGateChatOptionTarget,
): GonkaGateChatOptionValues {
	const config: GonkaGateChatOptionValues = {};

	for (const key of GONKAGATE_CHAT_OPTION_KEYS) {
		if (!supportsChatOptionTarget(key, target)) {
			continue;
		}

		const value = getOptionalNumberOption(options, key);

		if (value !== undefined) {
			config[key] = value;
		}
	}

	return config;
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
		requestBodyOptions: buildGonkaGateChatOptions(input.rawOptions ?? {}, 'requestBody'),
		aiModelOptions: buildGonkaGateChatOptions(input.rawOptions ?? {}, 'aiModel'),
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
		messages: parseChatMessages(input.node, input.rawMessages, input.itemIndex),
		stream: parameters.stream,
		...parameters.requestBodyOptions,
	};
}

function parseChatMessages(node: INode, rawMessages: unknown, itemIndex: number): IDataObject[] {
	let messages = rawMessages;

	if (typeof messages === 'string') {
		try {
			messages = JSON.parse(messages);
		} catch (error) {
			throw new NodeOperationError(node, error as Error, {
				itemIndex,
				message: 'Messages must be valid JSON',
				description: CHAT_MESSAGES_EXAMPLE,
			});
		}
	}

	if (!Array.isArray(messages) || messages.length === 0) {
		throw new NodeOperationError(node, 'Messages must be a non-empty array', {
			itemIndex,
			description: CHAT_MESSAGES_EXAMPLE,
		});
	}

	for (const message of messages) {
		if (!isMessageObject(message)) {
			throw new NodeOperationError(node, 'Each message must be a JSON object', {
				itemIndex,
			});
		}

		if (typeof message.role !== 'string' || message.role.trim().length === 0) {
			throw new NodeOperationError(node, 'Each message must include a role', {
				itemIndex,
			});
		}
	}

	return messages;
}

function getOptionalNumberOption(
	options: IDataObject,
	key: GonkaGateChatOptionKey,
): number | undefined {
	if (!Object.prototype.hasOwnProperty.call(options, key)) {
		return undefined;
	}

	const value = options[key];

	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function supportsChatOptionTarget(
	key: GonkaGateChatOptionKey,
	target: GonkaGateChatOptionTarget,
): boolean {
	return GONKAGATE_CHAT_OPTION_TARGETS[key].some((supportedTarget) => supportedTarget === target);
}

function isMessageObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
