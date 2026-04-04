import type {
	IDataObject,
	IDisplayOptions,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';

import { executeChatCompletion, gonkaGateChatCompletionProperties } from './actions/chatCompletion';
import { executeListModels } from './actions/listModels';

type GonkaGateOperationDefinition = {
	name: string;
	action: string;
	description: string;
	properties: readonly INodeProperties[];
	execute: (context: IExecuteFunctions, itemIndex: number) => Promise<IDataObject>;
};

const GONKAGATE_OPERATION_DEFINITIONS = {
	chatCompletion: {
		name: 'Chat Completion',
		action: 'Create a chat completion',
		description: 'Send a non-streaming chat completion request to GonkaGate',
		properties: gonkaGateChatCompletionProperties,
		execute: executeChatCompletion,
	},
	listModels: {
		name: 'List Models',
		action: 'List available models',
		description: 'List the models currently exposed by GonkaGate',
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
		name: 'operation',
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
): Promise<IDataObject> {
	return await GONKAGATE_OPERATION_DEFINITIONS[operation].execute(context, itemIndex);
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
			operation: [operation],
		},
	};
}
