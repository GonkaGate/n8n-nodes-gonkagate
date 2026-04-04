import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
} from 'n8n-workflow';

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

export type GonkaGateNodeMethods = NonNullable<INodeType['methods']>;

export type GonkaGateOperationDefinition = {
	type: GonkaGateOperation;
	displayName: string;
	action: string;
	description: string;
	properties: readonly INodeProperties[];
	execute: (context: IExecuteFunctions, itemIndex: number) => Promise<INodeExecutionData[]>;
	methods?: GonkaGateNodeMethods;
};

const gonkaGateOperationDefinitions = [
	{
		type: GONKAGATE_CHAT_COMPLETION_OPERATION,
		displayName: GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
		action: GONKAGATE_CHAT_COMPLETION_OPERATION_ACTION,
		description: GONKAGATE_CHAT_COMPLETION_OPERATION_DESCRIPTION,
		properties: gonkaGateChatCompletionProperties,
		execute: executeChatCompletion,
	},
	{
		type: GONKAGATE_LIST_MODELS_OPERATION,
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
	operation: GonkaGateOperation,
): GonkaGateOperationDefinition | undefined {
	return gonkaGateOperationDefinitions.find(
		(operationDefinition) => operationDefinition.type === operation,
	);
}
