import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { createGonkaGateModelSearchMethods, serializeGonkaGateError } from '../shared/GonkaGate';
import {
	createGonkaGateOperationProperty,
	executeGonkaGateOperation,
	GONKAGATE_DEFAULT_OPERATION,
	getGonkaGateOperationProperties,
	type GonkaGateOperation,
} from './operations';

export class GonkaGate implements INodeType {
	methods = createGonkaGateModelSearchMethods();

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
		properties: [createGonkaGateOperationProperty(), ...getGonkaGateOperationProperties()],
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
					GONKAGATE_DEFAULT_OPERATION,
				) as GonkaGateOperation;

				const response = await executeGonkaGateOperation(this, operation, itemIndex);

				returnData.push({
					json: response,
					pairedItem: inputItems.length > 0 ? { item: itemIndex } : undefined,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: serializeGonkaGateError(error),
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
