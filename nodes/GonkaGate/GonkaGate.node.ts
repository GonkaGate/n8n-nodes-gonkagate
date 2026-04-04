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
	executeGonkaGateOperation,
	GONKAGATE_DEFAULT_OPERATION,
	getGonkaGateOperationMethods,
	getGonkaGateOperationDisplayName,
	getGonkaGateOperationProperties,
	resolveGonkaGateOperation,
} from './operations';

export class GonkaGate implements INodeType {
	methods = {
		...GONKAGATE_MODEL_SELECTOR_FEATURES.methods,
		...(getGonkaGateOperationMethods() ?? {}),
	};

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
		properties: [createGonkaGateOperationProperty(), ...getGonkaGateOperationProperties()],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const itemCount = inputItems.length > 0 ? inputItems.length : 1;
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
			let operationName = 'Operation';

				try {
					const rawOperation = this.getNodeParameter(
						GONKAGATE_OPERATION_PARAMETER_NAME,
						itemIndex,
						GONKAGATE_DEFAULT_OPERATION,
					);
					const operation = resolveGonkaGateOperation(this.getNode(), rawOperation, itemIndex);
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
				const normalizedError = normalizeGonkaGateError(
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
