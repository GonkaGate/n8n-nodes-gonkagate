import type { IExecuteFunctions, INode, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
	GONKAGATE_LIST_MODELS_OPERATION_NAME,
} from '../../shared/GonkaGate/operationNames';
import {
	executeChatCompletion,
	GONKAGATE_CHAT_COMPLETION_OPERATION_ACTION,
	GONKAGATE_CHAT_COMPLETION_OPERATION_DESCRIPTION,
	gonkaGateChatCompletionProperties,
} from './actions/chatCompletion';
import {
	executeListModels,
	GONKAGATE_LIST_MODELS_OPERATION_ACTION,
	GONKAGATE_LIST_MODELS_OPERATION_DESCRIPTION,
} from './actions/listModels';
import {
	GONKAGATE_CHAT_COMPLETION_OPERATION,
	GONKAGATE_LIST_MODELS_OPERATION,
	type GonkaGateOperation,
} from './operationTypes';

export type GonkaGateOperationDefinition = {
	operation: GonkaGateOperation;
	displayName: string;
	action: string;
	description: string;
	properties: readonly INodeProperties[];
	execute: (context: IExecuteFunctions, itemIndex: number) => Promise<INodeExecutionData[]>;
};

const gonkaGateOperationDefinitions = [
	{
		operation: GONKAGATE_CHAT_COMPLETION_OPERATION,
		displayName: GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
		action: GONKAGATE_CHAT_COMPLETION_OPERATION_ACTION,
		description: GONKAGATE_CHAT_COMPLETION_OPERATION_DESCRIPTION,
		properties: gonkaGateChatCompletionProperties,
		execute: executeChatCompletion,
	},
	{
		operation: GONKAGATE_LIST_MODELS_OPERATION,
		displayName: GONKAGATE_LIST_MODELS_OPERATION_NAME,
		action: GONKAGATE_LIST_MODELS_OPERATION_ACTION,
		description: GONKAGATE_LIST_MODELS_OPERATION_DESCRIPTION,
		properties: [],
		execute: executeListModels,
	},
] as const satisfies readonly GonkaGateOperationDefinition[];

export function getGonkaGateOperationDefinitions(): readonly GonkaGateOperationDefinition[] {
	return gonkaGateOperationDefinitions;
}

export function getGonkaGateOperationDefinition(
	operation: string,
): GonkaGateOperationDefinition | undefined {
	return gonkaGateOperationDefinitions.find(
		(operationDefinition) => operationDefinition.operation === operation,
	);
}

export function resolveGonkaGateOperationDisplayName(operation: unknown): string | undefined {
	if (typeof operation !== 'string') {
		return undefined;
	}

	return getGonkaGateOperationDefinition(operation)?.displayName;
}

export function requireGonkaGateOperationDefinition(
	node: INode,
	rawOperation: unknown,
	itemIndex: number,
): GonkaGateOperationDefinition {
	if (typeof rawOperation === 'string') {
		const operationDefinition = getGonkaGateOperationDefinition(rawOperation);

		if (operationDefinition !== undefined) {
			return operationDefinition;
		}
	}

	throw new NodeOperationError(node, 'Unsupported GonkaGate operation', {
		itemIndex,
		description: 'Select one of the supported GonkaGate operations.',
	});
}
