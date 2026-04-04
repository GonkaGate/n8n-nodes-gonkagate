import type { IExecuteFunctions, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { resolveGonkaGateChatOptions, type GonkaGateChatOptionValues } from './chatOptions';
import { resolveGonkaGateModelId } from './modelId';
import { GONKAGATE_MODEL_PARAMETER_NAME, GONKAGATE_OPTIONS_PARAMETER_NAME } from './parameters';

export type GonkaGateNodeParameterContext = Pick<IExecuteFunctions, 'getNode' | 'getNodeParameter'>;

export type ResolvedGonkaGateChatParameters = {
	model: string;
	stream: boolean;
	requestBodyOptions: GonkaGateChatOptionValues;
	aiModelOptions: GonkaGateChatOptionValues;
};

export type GonkaGateBaseChatParameterInput = {
	node: INode;
	rawModel: unknown;
	rawOptions?: unknown;
	itemIndex: number;
};

export function resolveGonkaGateBaseChatParametersFromContext(
	context: GonkaGateNodeParameterContext,
	itemIndex: number,
): GonkaGateBaseChatParameterInput {
	return {
		node: context.getNode(),
		rawModel: context.getNodeParameter(GONKAGATE_MODEL_PARAMETER_NAME, itemIndex),
		rawOptions: context.getNodeParameter(GONKAGATE_OPTIONS_PARAMETER_NAME, itemIndex, {}),
		itemIndex,
	};
}

export function resolveGonkaGateChatParameters(input: {
	node: INode;
	rawModel: unknown;
	rawStreaming: unknown;
	rawOptions?: unknown;
	itemIndex: number;
}): ResolvedGonkaGateChatParameters {
	const rawOptions = resolveOptionalOptionsParameter(input.node, input.rawOptions, input.itemIndex);
	const requestBodyOptions = resolveGonkaGateChatOptions(rawOptions, 'requestBody');
	const aiModelOptions = resolveGonkaGateChatOptions(rawOptions, 'aiModel');

	return {
		model: resolveGonkaGateModelId(input.node, input.rawModel, input.itemIndex),
		stream: resolveRequiredBooleanParameter(
			input.node,
			input.rawStreaming,
			'Enable Streaming',
			input.itemIndex,
		),
		requestBodyOptions,
		aiModelOptions,
	};
}

function resolveRequiredBooleanParameter(
	node: INode,
	rawValue: unknown,
	displayName: string,
	itemIndex: number,
): boolean {
	if (typeof rawValue === 'boolean') {
		return rawValue;
	}

	throw new NodeOperationError(node, `${displayName} must be a boolean`, {
		itemIndex,
	});
}

function resolveOptionalOptionsParameter(
	node: INode,
	rawOptions: unknown,
	itemIndex: number,
): Record<string, unknown> | undefined {
	if (rawOptions === undefined) {
		return undefined;
	}

	if (isRecord(rawOptions)) {
		return rawOptions;
	}

	throw new NodeOperationError(node, 'Options must be an object', {
		itemIndex,
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
