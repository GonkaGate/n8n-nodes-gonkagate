import type { IDataObject, INode, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { resolveGonkaGateModelId } from './modelId';

const CHAT_MESSAGES_EXAMPLE =
	'Provide an array of OpenAI-compatible chat message objects, for example [{"role":"user","content":"Hello from n8n"}].';

export type GonkaGateChatOptionKey =
	| 'frequencyPenalty'
	| 'maxRetries'
	| 'maxTokens'
	| 'presencePenalty'
	| 'temperature'
	| 'timeout'
	| 'topP';

type GonkaGateChatOptionSpec = {
	key: GonkaGateChatOptionKey;
	property: INodeProperties;
};

const GONKAGATE_CHAT_OPTION_SPECS = [
	{
		key: 'frequencyPenalty',
		property: {
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
	},
	{
		key: 'maxRetries',
		property: {
			displayName: 'Max Retries',
			name: 'maxRetries',
			type: 'number',
			default: 2,
			typeOptions: {
				minValue: 0,
			},
			description: 'Maximum number of retry attempts for transient upstream failures',
		},
	},
	{
		key: 'maxTokens',
		property: {
			displayName: 'Maximum Number of Tokens',
			name: 'maxTokens',
			type: 'number',
			default: 1024,
			typeOptions: {
				minValue: 1,
			},
			description: 'Upper bound for completion tokens when the selected model supports it',
		},
	},
	{
		key: 'presencePenalty',
		property: {
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
	},
	{
		key: 'temperature',
		property: {
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
	},
	{
		key: 'timeout',
		property: {
			displayName: 'Timeout',
			name: 'timeout',
			type: 'number',
			default: 60000,
			typeOptions: {
				minValue: 1,
			},
			description: 'Maximum request time in milliseconds',
		},
	},
	{
		key: 'topP',
		property: {
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
	},
] as const satisfies readonly GonkaGateChatOptionSpec[];

type GonkaGateChatOptionValues = Partial<Record<GonkaGateChatOptionKey, number>>;

export type ResolvedGonkaGateChatParameters = {
	model: string;
	stream: boolean;
	options: GonkaGateChatOptionValues;
};

export function createGonkaGateChatModelOptionsProperty(): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description:
			'Optional chat-completions settings. This node keeps Responses API mode off and targets GonkaGate chat completions only.',
		options: GONKAGATE_CHAT_OPTION_SPECS.map((spec) => spec.property),
	};
}

export function buildGonkaGateChatModelOptions(options: IDataObject): GonkaGateChatOptionValues {
	const config: GonkaGateChatOptionValues = {};

	for (const spec of GONKAGATE_CHAT_OPTION_SPECS) {
		const value = getOptionalNumberOption(options, spec.key);

		if (value !== undefined) {
			config[spec.key] = value;
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
		options: buildGonkaGateChatModelOptions(input.rawOptions ?? {}),
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
		...parameters.options,
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

function isMessageObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
