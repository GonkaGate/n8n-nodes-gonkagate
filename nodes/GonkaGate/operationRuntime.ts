import type { IExecuteFunctions, INode, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	getGonkaGateOperationDefinition,
	type GonkaGateOperationDefinition,
} from './operationDefinitions';
import type { GonkaGateOperation } from './operationTypes';

export async function executeGonkaGateOperationDefinition(
	context: IExecuteFunctions,
	operationDefinition: GonkaGateOperationDefinition,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return await operationDefinition.execute(context, itemIndex);
}

export function resolveGonkaGateOperationDefinition(
	node: INode,
	rawOperation: unknown,
	itemIndex: number,
): GonkaGateOperationDefinition {
	if (typeof rawOperation === 'string' && isGonkaGateOperation(rawOperation)) {
		return requireGonkaGateOperationDefinition(rawOperation);
	}

	throw new NodeOperationError(node, 'Unsupported GonkaGate operation', {
		itemIndex,
		description: 'Select one of the supported GonkaGate operations.',
	});
}

function isGonkaGateOperation(value: string): value is GonkaGateOperation {
	return getGonkaGateOperationDefinition(value as GonkaGateOperation) !== undefined;
}

function requireGonkaGateOperationDefinition(
	operation: GonkaGateOperation,
): GonkaGateOperationDefinition {
	const operationDefinition = getGonkaGateOperationDefinition(operation);

	if (operationDefinition === undefined) {
		throw new Error(`Unsupported GonkaGate operation: ${operation}`);
	}

	return operationDefinition;
}
