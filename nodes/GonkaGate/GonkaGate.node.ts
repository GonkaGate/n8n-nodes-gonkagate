import type {
	IExecuteFunctions,
	INode,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { normalizeGonkaGateError, serializeGonkaGateError } from '../../shared/GonkaGate/errors';
import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import { createGonkaGateModelSearchMethods } from '../../shared/GonkaGate/modelParameter';
import {
	createGonkaGateOperationProperty,
	executeGonkaGateOperation,
	GONKAGATE_DEFAULT_OPERATION,
	getGonkaGateOperationDisplayName,
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
				name: GONKAGATE_CREDENTIAL_NAME,
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
			let operationName = 'Operation';

			try {
				const operation = this.getNodeParameter(
					'operation',
					itemIndex,
					GONKAGATE_DEFAULT_OPERATION,
				) as GonkaGateOperation;
				operationName = getGonkaGateOperationDisplayName(operation);

				const operationData = await executeGonkaGateOperation(this, operation, itemIndex);

				for (const data of operationData) {
					returnData.push({
						...data,
						pairedItem:
							data.pairedItem ?? (inputItems.length > 0 ? { item: itemIndex } : undefined),
					});
				}
			} catch (error) {
				const normalizedError = normalizeExecutionError(
					this.getNode(),
					error,
					itemIndex,
					operationName,
				);

				if (this.continueOnFail()) {
					returnData.push({
						json: serializeGonkaGateError(normalizedError),
						pairedItem: inputItems.length > 0 ? { item: itemIndex } : undefined,
					});
					continue;
				}

				throw normalizedError;
			}
		}

		return [returnData];
	}
}

function normalizeExecutionError(
	node: INode,
	error: unknown,
	itemIndex: number,
	operationName: string,
): NodeApiError | NodeOperationError {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		return error;
	}

	return normalizeGonkaGateError(node, error, itemIndex, operationName);
}
