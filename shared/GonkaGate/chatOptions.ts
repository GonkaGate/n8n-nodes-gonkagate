import type { IDataObject, INodeProperties } from 'n8n-workflow';

type GonkaGateChatOptionTarget = 'requestBody' | 'aiModel';

export type GonkaGateChatOptionKey =
	| 'frequencyPenalty'
	| 'maxRetries'
	| 'maxTokens'
	| 'presencePenalty'
	| 'temperature'
	| 'timeout'
	| 'topP';

export type GonkaGateChatOptionValues = Partial<Record<GonkaGateChatOptionKey, number>>;

type GonkaGateChatOptionDefinition = {
	targets: readonly GonkaGateChatOptionTarget[];
	property: INodeProperties;
};

const GONKAGATE_CHAT_OPTION_DEFINITIONS = {
	frequencyPenalty: {
		targets: ['requestBody', 'aiModel'],
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
	maxRetries: {
		targets: ['aiModel'],
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
	maxTokens: {
		targets: ['requestBody', 'aiModel'],
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
	presencePenalty: {
		targets: ['requestBody', 'aiModel'],
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
	temperature: {
		targets: ['requestBody', 'aiModel'],
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
	timeout: {
		targets: ['aiModel'],
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
	topP: {
		targets: ['requestBody', 'aiModel'],
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
} as const satisfies Record<GonkaGateChatOptionKey, GonkaGateChatOptionDefinition>;

const GONKAGATE_CHAT_OPTION_KEYS = Object.keys(
	GONKAGATE_CHAT_OPTION_DEFINITIONS,
) as GonkaGateChatOptionKey[];

export function createGonkaGateChatModelOptionsProperty(): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description:
			'Optional chat-completions settings. This node keeps Responses API mode off and targets GonkaGate chat completions only.',
		options: getGonkaGateChatOptionProperties('aiModel'),
	};
}

export function resolveGonkaGateChatOptions(
	rawOptions: IDataObject | undefined,
	target: GonkaGateChatOptionTarget,
): GonkaGateChatOptionValues {
	const options = rawOptions ?? {};
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

function getGonkaGateChatOptionProperties(target: GonkaGateChatOptionTarget): INodeProperties[] {
	return GONKAGATE_CHAT_OPTION_KEYS.filter((key) => supportsChatOptionTarget(key, target)).map(
		(key) => GONKAGATE_CHAT_OPTION_DEFINITIONS[key].property,
	);
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
	return GONKAGATE_CHAT_OPTION_DEFINITIONS[key].targets.some(
		(supportedTarget) => supportedTarget === target,
	);
}
