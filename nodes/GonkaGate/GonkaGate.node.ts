import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { normalizeGonkaGateError, serializeGonkaGateError } from '../../shared/GonkaGate/errors';
import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import {
	GONKAGATE_NODE_DESCRIPTION,
	GONKAGATE_NODE_DISPLAY_NAME,
	GONKAGATE_NODE_ICON,
} from '../../shared/GonkaGate/metadata';
import { GONKAGATE_MODEL_SELECTOR_FEATURES } from '../../shared/GonkaGate/modelParameter';
import { GONKAGATE_OPERATION_PARAMETER_NAME } from '../../shared/GonkaGate/parameters';
import {
	createGonkaGateOperationProperty,
	getGonkaGateOperationProperties,
} from './operationProperties';
import { getGonkaGateOperationMethods } from './operationMethods';
import {
	executeGonkaGateOperationDefinition,
	resolveGonkaGateOperationDefinition,
} from './operationRuntime';
import { GONKAGATE_DEFAULT_OPERATION } from './operationTypes';

const GONKAGATE_UNKNOWN_OPERATION_NAME = 'Operation';

const gonkaGateNodeMethods = {
	...GONKAGATE_MODEL_SELECTOR_FEATURES.methods,
	...(getGonkaGateOperationMethods() ?? {}),
};

const gonkaGateNodeProperties = [
	createGonkaGateOperationProperty(),
	...getGonkaGateOperationProperties(),
];

export class GonkaGate implements INodeType {
	methods = gonkaGateNodeMethods;

	description: INodeTypeDescription = {
		displayName: GONKAGATE_NODE_DISPLAY_NAME,
		name: 'gonkaGate',
		icon: GONKAGATE_NODE_ICON,
		group: ['transform'],
		version: [1],
		subtitle: `={{$parameter["${GONKAGATE_OPERATION_PARAMETER_NAME}"]}}`,
		description: GONKAGATE_NODE_DESCRIPTION,
		defaults: {
			name: GONKAGATE_NODE_DISPLAY_NAME,
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
		properties: gonkaGateNodeProperties,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const itemCount = resolveExecutionItemCount(inputItems);
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
			let operationDisplayName = GONKAGATE_UNKNOWN_OPERATION_NAME;
			const defaultPairedItem = resolveDefaultPairedItem(inputItems, itemIndex);

			try {
				const executedOperation = await executeGonkaGateOperationForItem(this, itemIndex);
				operationDisplayName = executedOperation.operationDisplayName;

				appendOperationOutput(returnData, executedOperation.outputData, defaultPairedItem);
			} catch (error) {
				const normalizedError = normalizeGonkaGateError(
					this.getNode(),
					error,
					itemIndex,
					operationDisplayName,
				);

				if (this.continueOnFail()) {
					returnData.push({
						json: serializeGonkaGateError(normalizedError),
						pairedItem: defaultPairedItem,
					});
					continue;
				}

				throw normalizedError;
			}
		}

		return [returnData];
	}
}

async function executeGonkaGateOperationForItem(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<{ operationDisplayName: string; outputData: INodeExecutionData[] }> {
	const rawOperation = context.getNodeParameter(
		GONKAGATE_OPERATION_PARAMETER_NAME,
		itemIndex,
		GONKAGATE_DEFAULT_OPERATION,
	);
	const operationDefinition = resolveGonkaGateOperationDefinition(
		context.getNode(),
		rawOperation,
		itemIndex,
	);

	return {
		operationDisplayName: operationDefinition.displayName,
		outputData: await executeGonkaGateOperationDefinition(context, operationDefinition, itemIndex),
	};
}

function appendOperationOutput(
	returnData: INodeExecutionData[],
	outputData: INodeExecutionData[],
	defaultPairedItem: INodeExecutionData['pairedItem'],
): void {
	for (const outputItem of outputData) {
		returnData.push({
			...outputItem,
			pairedItem: outputItem.pairedItem ?? defaultPairedItem,
		});
	}
}

function resolveDefaultPairedItem(
	inputItems: INodeExecutionData[],
	itemIndex: number,
): INodeExecutionData['pairedItem'] {
	return inputItems.length > 0 ? { item: itemIndex } : undefined;
}

function resolveExecutionItemCount(inputItems: INodeExecutionData[]): number {
	// Parameter-only n8n nodes still execute once when nothing is connected upstream.
	return inputItems.length > 0 ? inputItems.length : 1;
}
