import type {
	IDisplayOptions,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';

import { GONKAGATE_OPERATION_PARAMETER_NAME } from '../../shared/GonkaGate/parameters';
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

type GonkaGateOperationDefinition = {
	name: string;
	action: string;
	description: string;
	properties: readonly INodeProperties[];
	execute: (context: IExecuteFunctions, itemIndex: number) => Promise<INodeExecutionData[]>;
};

const GONKAGATE_OPERATION_DEFINITIONS = {
	chatCompletion: {
		name: GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
		action: GONKAGATE_CHAT_COMPLETION_OPERATION_ACTION,
		description: GONKAGATE_CHAT_COMPLETION_OPERATION_DESCRIPTION,
		properties: gonkaGateChatCompletionProperties,
		execute: executeChatCompletion,
	},
	listModels: {
		name: GONKAGATE_LIST_MODELS_OPERATION_NAME,
		action: GONKAGATE_LIST_MODELS_OPERATION_ACTION,
		description: GONKAGATE_LIST_MODELS_OPERATION_DESCRIPTION,
		properties: [],
		execute: executeListModels,
	},
} as const satisfies Record<string, GonkaGateOperationDefinition>;

export type GonkaGateOperation = keyof typeof GONKAGATE_OPERATION_DEFINITIONS;

export const GONKAGATE_DEFAULT_OPERATION: GonkaGateOperation = 'chatCompletion';

const GONKAGATE_OPERATION_KEYS = Object.keys(
	GONKAGATE_OPERATION_DEFINITIONS,
) as GonkaGateOperation[];

export function createGonkaGateOperationProperty(): INodeProperties {
	return {
		displayName: 'Operation',
		name: GONKAGATE_OPERATION_PARAMETER_NAME,
		type: 'options',
		noDataExpression: true,
		default: GONKAGATE_DEFAULT_OPERATION,
		options: GONKAGATE_OPERATION_KEYS.map((operation) => ({
			name: GONKAGATE_OPERATION_DEFINITIONS[operation].name,
			value: operation,
			action: GONKAGATE_OPERATION_DEFINITIONS[operation].action,
			description: GONKAGATE_OPERATION_DEFINITIONS[operation].description,
		})),
	};
}

export function getGonkaGateOperationProperties(): INodeProperties[] {
	return GONKAGATE_OPERATION_KEYS.flatMap((operation) =>
		GONKAGATE_OPERATION_DEFINITIONS[operation].properties.map((property) =>
			withOperationDisplayOptions(operation, property),
		),
	);
}

export async function executeGonkaGateOperation(
	context: IExecuteFunctions,
	operation: GonkaGateOperation,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return await GONKAGATE_OPERATION_DEFINITIONS[operation].execute(context, itemIndex);
}

export function getGonkaGateOperationDisplayName(operation: GonkaGateOperation): string {
	return GONKAGATE_OPERATION_DEFINITIONS[operation].name;
}

function withOperationDisplayOptions(
	operation: GonkaGateOperation,
	property: INodeProperties,
): INodeProperties {
	return {
		...property,
		displayOptions: mergeDisplayOptions(property.displayOptions, operation),
	};
}

function mergeDisplayOptions(
	displayOptions: IDisplayOptions | undefined,
	operation: GonkaGateOperation,
): IDisplayOptions {
	return {
		...(displayOptions ?? {}),
		show: {
			...(displayOptions?.show ?? {}),
			[GONKAGATE_OPERATION_PARAMETER_NAME]: [operation],
		},
	};
}
