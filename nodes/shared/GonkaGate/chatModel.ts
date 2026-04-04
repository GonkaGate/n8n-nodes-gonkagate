import { supplyModel } from 'ai-node-sdk';
import type { OpenAiModel } from 'ai-node-sdk';
import type { IDataObject, INodeProperties, ISupplyDataFunctions, SupplyData } from 'n8n-workflow';

import {
	buildGonkaGateDefaultHeaders,
	resolveRequiredGonkaGateConnectionConfig,
} from './credentials';
import { resolveGonkaGateModelId } from './models';

type GonkaGateChatModelOptionKey =
	| 'frequencyPenalty'
	| 'maxRetries'
	| 'maxTokens'
	| 'presencePenalty'
	| 'temperature'
	| 'timeout'
	| 'topP';

type GonkaGateChatModelOptionSpec = {
	key: GonkaGateChatModelOptionKey;
	property: INodeProperties;
};

const GONKAGATE_CHAT_MODEL_OPTION_SPECS = [
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
] as const satisfies readonly GonkaGateChatModelOptionSpec[];

export function createGonkaGateChatModelOptionsProperty(): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		description:
			'Optional chat-completions settings. This node keeps Responses API mode off and targets GonkaGate chat completions only.',
		options: GONKAGATE_CHAT_MODEL_OPTION_SPECS.map((spec) => spec.property),
	};
}

export function buildGonkaGateChatModelOptions(
	options: IDataObject,
): Partial<Record<GonkaGateChatModelOptionKey, number>> {
	const config: Partial<Record<GonkaGateChatModelOptionKey, number>> = {};

	for (const spec of GONKAGATE_CHAT_MODEL_OPTION_SPECS) {
		const value = getOptionalNumberOption(options, spec.key);

		if (value !== undefined) {
			config[spec.key] = value;
		}
	}

	return config;
}

export function buildGonkaGateChatModelSupplyOptions(input: {
	context: Pick<ISupplyDataFunctions, 'getNode'>;
	credentials: Record<string, unknown>;
	model: unknown;
	streaming: boolean;
	options: IDataObject;
	itemIndex: number;
}): OpenAiModel {
	const connection = resolveRequiredGonkaGateConnectionConfig(
		input.context.getNode(),
		input.credentials,
		input.itemIndex,
	);

	return {
		type: 'openai',
		baseUrl: connection.baseUrl,
		apiKey: connection.apiKey,
		defaultHeaders: buildGonkaGateDefaultHeaders(connection.defaultHeaders),
		model: resolveGonkaGateModelId(input.context.getNode(), input.model, input.itemIndex),
		useResponsesApi: false,
		streaming: input.streaming,
		...buildGonkaGateChatModelOptions(input.options),
	};
}

export async function supplyGonkaGateChatModel(
	context: ISupplyDataFunctions,
	itemIndex: number,
): Promise<SupplyData> {
	const credentials = await context.getCredentials('gonkaGateApi', itemIndex);
	const options = context.getNodeParameter('options', itemIndex, {}) as IDataObject;

	return supplyModel(
		context,
		buildGonkaGateChatModelSupplyOptions({
			context,
			credentials,
			model: context.getNodeParameter('model', itemIndex),
			streaming: context.getNodeParameter('streaming', itemIndex, true) as boolean,
			options,
			itemIndex,
		}),
	);
}

function getOptionalNumberOption(
	options: IDataObject,
	key: GonkaGateChatModelOptionKey,
): number | undefined {
	if (!Object.prototype.hasOwnProperty.call(options, key)) {
		return undefined;
	}

	const value = options[key];

	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
