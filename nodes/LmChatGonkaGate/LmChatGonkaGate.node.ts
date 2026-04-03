import { supplyModel } from 'ai-node-sdk';
import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { resolveGonkaGateBaseUrl } from '../GonkaGate/utils/credentials';
import {
	createGonkaGateModelSelectorProperty,
	resolveGonkaGateModelId,
	searchGonkaGateModels,
} from '../GonkaGate/utils/models';

type GonkaGateCredentialData = {
	apiKey?: string;
	url?: string;
};

export class LmChatGonkaGate implements INodeType {
	methods = {
		listSearch: {
			async searchModels(this: ILoadOptionsFunctions, filter?: string) {
				return await searchGonkaGateModels.call(this, filter);
			},
		},
	};

	description: INodeTypeDescription = {
		displayName: 'GonkaGate Chat Model',
		name: 'lmChatGonkaGate',
		icon: 'file:gonkagate.svg',
		group: ['transform'],
		version: [1],
		description:
			'Use GonkaGate chat-completions models in AI workflows while keeping the provider-branded GonkaGate package surface',
		defaults: {
			name: 'GonkaGate Chat Model',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		credentials: [
			{
				name: 'gonkaGateApi',
				required: true,
			},
		],
		properties: [
			createGonkaGateModelSelectorProperty(),
			{
				displayName: 'Enable Streaming',
				name: 'streaming',
				type: 'boolean',
				default: true,
				description:
					'Whether n8n AI workflows should use GonkaGate SSE streaming on /v1/chat/completions when the surrounding workflow path supports visible live streaming',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				description:
					'Optional chat-completions settings. This node keeps Responses API mode off and targets GonkaGate chat completions only.',
				options: [
					{
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
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						default: 2,
						typeOptions: {
							minValue: 0,
						},
						description: 'Maximum number of retry attempts for transient upstream failures',
					},
					{
						displayName: 'Maximum Number of Tokens',
						name: 'maxTokens',
						type: 'number',
						default: 1024,
						typeOptions: {
							minValue: 1,
						},
						description: 'Upper bound for completion tokens when the selected model supports it',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presencePenalty',
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 1,
						},
						description:
							'Encourage the model to introduce new topics instead of staying repetitive',
					},
					{
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
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 60000,
						typeOptions: {
							minValue: 1,
						},
						description: 'Maximum request time in milliseconds',
					},
					{
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
				],
			},
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials<GonkaGateCredentialData>(
			'gonkaGateApi',
			itemIndex,
		);
		const model = resolveGonkaGateModelId(
			this.getNode(),
			this.getNodeParameter('model', itemIndex),
			itemIndex,
		);
		const streaming = this.getNodeParameter('streaming', itemIndex, true) as boolean;
		const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
		const apiKey = typeof credentials.apiKey === 'string' ? credentials.apiKey.trim() : '';

		if (apiKey.length === 0) {
			throw new NodeOperationError(this.getNode(), 'API Key is required', {
				itemIndex,
			});
		}

		return supplyModel(this, {
			type: 'openai',
			baseUrl: resolveGonkaGateBaseUrl(credentials.url),
			apiKey,
			model,
			useResponsesApi: false,
			streaming,
			temperature: getOptionalNumberOption(options, 'temperature'),
			maxTokens: getOptionalNumberOption(options, 'maxTokens'),
			topP: getOptionalNumberOption(options, 'topP'),
			frequencyPenalty: getOptionalNumberOption(options, 'frequencyPenalty'),
			presencePenalty: getOptionalNumberOption(options, 'presencePenalty'),
			maxRetries: getOptionalNumberOption(options, 'maxRetries'),
			timeout: getOptionalNumberOption(options, 'timeout'),
		});
	}
}

function getOptionalNumberOption(options: IDataObject, key: string): number | undefined {
	if (!Object.prototype.hasOwnProperty.call(options, key)) {
		return undefined;
	}

	const value = options[key];

	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
