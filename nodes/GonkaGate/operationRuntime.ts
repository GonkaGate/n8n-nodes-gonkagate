import type { IExecuteFunctions, INode, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { getGonkaGateOperationDefinition } from './operationDefinitions';
import type { GonkaGateOperation } from './operationTypes';

export async function executeGonkaGateOperation(
	context: IExecuteFunctions,
	operation: GonkaGateOperation,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return await requireGonkaGateOperationDefinition(operation).execute(context, itemIndex);
}

export function resolveGonkaGateOperation(
	node: INode,
	rawOperation: unknown,
	itemIndex: number,
): GonkaGateOperation {
	if (typeof rawOperation === 'string' && isGonkaGateOperation(rawOperation)) {
		return rawOperation;
	}

	throw new NodeOperationError(node, 'Unsupported GonkaGate operation', {
		itemIndex,
		description: 'Select one of the supported GonkaGate operations.',
	});
}

export function getGonkaGateOperationDisplayName(operation: GonkaGateOperation): string {
	return requireGonkaGateOperationDefinition(operation).displayName;
}

function isGonkaGateOperation(value: string): value is GonkaGateOperation {
	return getGonkaGateOperationDefinition(value as GonkaGateOperation) !== undefined;
}

function requireGonkaGateOperationDefinition(operation: GonkaGateOperation) {
	const operationDefinition = getGonkaGateOperationDefinition(operation);

	if (operationDefinition === undefined) {
		throw new Error(`Unsupported GonkaGate operation: ${operation}`);
	}

	return operationDefinition;
}
