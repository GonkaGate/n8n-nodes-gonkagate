import type {
	IDisplayOptions,
	IExecuteFunctions,
	INodeExecutionData,
	INode,
	INodeProperties,
	INodeType,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

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

export const GONKAGATE_CHAT_COMPLETION_OPERATION = 'chatCompletion';
export const GONKAGATE_LIST_MODELS_OPERATION = 'listModels';

export type GonkaGateOperation =
	| typeof GONKAGATE_CHAT_COMPLETION_OPERATION
	| typeof GONKAGATE_LIST_MODELS_OPERATION;

type GonkaGateNodeMethods = NonNullable<INodeType['methods']>;

type GonkaGateOperationDefinition = {
	value: GonkaGateOperation;
	name: string;
	action: string;
	description: string;
	properties: readonly INodeProperties[];
	execute: (context: IExecuteFunctions, itemIndex: number) => Promise<INodeExecutionData[]>;
	methods?: GonkaGateNodeMethods;
};

const GONKAGATE_OPERATION_DEFINITIONS = {
	[GONKAGATE_CHAT_COMPLETION_OPERATION]: {
		value: GONKAGATE_CHAT_COMPLETION_OPERATION,
		name: GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
		action: GONKAGATE_CHAT_COMPLETION_OPERATION_ACTION,
		description: GONKAGATE_CHAT_COMPLETION_OPERATION_DESCRIPTION,
		properties: gonkaGateChatCompletionProperties,
		execute: executeChatCompletion,
	},
	[GONKAGATE_LIST_MODELS_OPERATION]: {
		value: GONKAGATE_LIST_MODELS_OPERATION,
		name: GONKAGATE_LIST_MODELS_OPERATION_NAME,
		action: GONKAGATE_LIST_MODELS_OPERATION_ACTION,
		description: GONKAGATE_LIST_MODELS_OPERATION_DESCRIPTION,
		properties: [],
		execute: executeListModels,
	},
} as const satisfies Record<GonkaGateOperation, GonkaGateOperationDefinition>;

export const GONKAGATE_DEFAULT_OPERATION: GonkaGateOperation = GONKAGATE_CHAT_COMPLETION_OPERATION;

const GONKAGATE_OPERATION_KEYS = Object.keys(
	GONKAGATE_OPERATION_DEFINITIONS,
) as GonkaGateOperation[];

export function getGonkaGateOperationDefinitions(): readonly GonkaGateOperationDefinition[] {
	return GONKAGATE_OPERATION_KEYS.map((operation) => GONKAGATE_OPERATION_DEFINITIONS[operation]);
}

export function createGonkaGateOperationProperty(): INodeProperties {
	return {
		displayName: 'Operation',
		name: GONKAGATE_OPERATION_PARAMETER_NAME,
		type: 'options',
			noDataExpression: true,
			default: GONKAGATE_DEFAULT_OPERATION,
			options: getGonkaGateOperationDefinitions().map((operation) => ({
				name: operation.name,
				value: operation.value,
				action: operation.action,
				description: operation.description,
			})),
		};
}

export function getGonkaGateOperationProperties(): INodeProperties[] {
	return GONKAGATE_OPERATION_KEYS.flatMap((operation) =>
		GONKAGATE_OPERATION_DEFINITIONS[operation].properties.map((property: INodeProperties) =>
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
	return GONKAGATE_OPERATION_DEFINITIONS[operation].name;
}

export function getGonkaGateOperationMethods(): GonkaGateNodeMethods | undefined {
	const mergedMethods = mergeGonkaGateNodeMethods(
		...getGonkaGateOperationDefinitions().map((operation) => operation.methods),
	);

	return hasNodeMethods(mergedMethods) ? mergedMethods : undefined;
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

function isGonkaGateOperation(value: string): value is GonkaGateOperation {
	return value in GONKAGATE_OPERATION_DEFINITIONS;
}

function mergeGonkaGateNodeMethods(
	...methodSets: Array<GonkaGateNodeMethods | undefined>
): GonkaGateNodeMethods {
	const mergedMethods: GonkaGateNodeMethods = {};

	for (const methodSet of methodSets) {
		if (methodSet === undefined) {
			continue;
		}

		mergeNodeMethodNamespace(mergedMethods, 'loadOptions', methodSet.loadOptions);
		mergeNodeMethodNamespace(mergedMethods, 'listSearch', methodSet.listSearch);
		mergeNodeMethodNamespace(mergedMethods, 'credentialTest', methodSet.credentialTest);
		mergeNodeMethodNamespace(mergedMethods, 'resourceMapping', methodSet.resourceMapping);
		mergeNodeMethodNamespace(mergedMethods, 'localResourceMapping', methodSet.localResourceMapping);
		mergeNodeMethodNamespace(mergedMethods, 'actionHandler', methodSet.actionHandler);
	}

	return mergedMethods;
}

function mergeNodeMethodNamespace<K extends keyof GonkaGateNodeMethods>(
	methods: GonkaGateNodeMethods,
	namespace: K,
	values: GonkaGateNodeMethods[K] | undefined,
): void {
	if (values === undefined) {
		return;
	}

	methods[namespace] = {
		...(methods[namespace] ?? {}),
		...values,
	} as GonkaGateNodeMethods[K];
}

function hasNodeMethods(methods: GonkaGateNodeMethods): boolean {
	return Object.values(methods).some((value) => value !== undefined && Object.keys(value).length > 0);
}
