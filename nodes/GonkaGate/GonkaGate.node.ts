import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { executeChatCompletion } from './actions/chatCompletion';
import { executeListModels } from './actions/listModels';
import { createGonkaGateModelSelectorProperty, searchGonkaGateModels } from './utils/models';

type GonkaGateOperation = 'chatCompletion' | 'listModels';

export class GonkaGate implements INodeType {
	methods = {
		listSearch: {
			async searchModels(this: ILoadOptionsFunctions, filter?: string) {
				return await searchGonkaGateModels.call(this, filter);
			},
		},
	};

	description: INodeTypeDescription = {
		displayName: 'GonkaGate',
		name: 'gonkaGate',
		icon: 'file:gonkagate.svg',
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"]}}',
		description: 'Use GonkaGate model discovery and chat completions in n8n workflows',
		defaults: {
			name: 'GonkaGate',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'gonkaGateApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'chatCompletion',
				options: [
					{
						name: 'Chat Completion',
						value: 'chatCompletion',
						action: 'Create a chat completion',
						description: 'Send a non-streaming chat completion request to GonkaGate',
					},
					{
						name: 'List Models',
						value: 'listModels',
						action: 'List available models',
						description: 'List the models currently exposed by GonkaGate',
					},
				],
			},
			createGonkaGateModelSelectorProperty({
				show: {
					operation: ['chatCompletion'],
				},
			}),
			{
				displayName: 'Messages (JSON)',
				name: 'messages',
				type: 'json',
				default: '[\n  {\n    "role": "user",\n    "content": "Hello from n8n"\n  }\n]',
				required: true,
				description:
					'OpenAI-compatible chat messages sent to POST /v1/chat/completions. GonkaGate-specific advanced extensions stay out of the MVP surface for now.',
				displayOptions: {
					show: {
						operation: ['chatCompletion'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const itemCount = inputItems.length > 0 ? inputItems.length : 1;
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
			try {
				const operation = this.getNodeParameter(
					'operation',
					itemIndex,
					'chatCompletion',
				) as GonkaGateOperation;

				const response =
					operation === 'listModels'
						? await executeListModels(this, itemIndex)
						: await executeChatCompletion(this, itemIndex);

				returnData.push({
					json: response,
					pairedItem: inputItems.length > 0 ? { item: itemIndex } : undefined,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: inputItems.length > 0 ? { item: itemIndex } : undefined,
					});
					continue;
				}

				if (error instanceof NodeApiError || error instanceof NodeOperationError) {
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
