import type { IDataObject, INode } from 'n8n-workflow';

import { resolveGonkaGateChatOptions, type GonkaGateChatOptionValues } from './chatOptions';
import { resolveGonkaGateModelId } from './modelId';
import { GONKAGATE_MODEL_PARAMETER_NAME, GONKAGATE_OPTIONS_PARAMETER_NAME } from './parameters';

export type GonkaGateNodeParameterContext = {
	getNode(): INode;
	getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown): unknown;
};

export type ResolvedGonkaGateChatParameters = {
	model: string;
	stream: boolean;
	requestBodyOptions: GonkaGateChatOptionValues;
	aiModelOptions: GonkaGateChatOptionValues;
};

export type GonkaGateBaseChatParameterInput = {
	node: INode;
	rawModel: unknown;
	rawOptions?: IDataObject;
	itemIndex: number;
};

export function resolveGonkaGateBaseChatParametersFromContext(
	context: GonkaGateNodeParameterContext,
	itemIndex: number,
): GonkaGateBaseChatParameterInput {
	return {
		node: context.getNode(),
		rawModel: context.getNodeParameter(GONKAGATE_MODEL_PARAMETER_NAME, itemIndex),
		rawOptions: context.getNodeParameter(
			GONKAGATE_OPTIONS_PARAMETER_NAME,
			itemIndex,
			{},
		) as IDataObject,
		itemIndex,
	};
}

export function resolveGonkaGateChatParameters(input: {
	node: INode;
	rawModel: unknown;
	rawStreaming: boolean;
	rawOptions?: IDataObject;
	itemIndex: number;
}): ResolvedGonkaGateChatParameters {
	const requestBodyOptions = resolveGonkaGateChatOptions(input.rawOptions, 'requestBody');
	const aiModelOptions = resolveGonkaGateChatOptions(input.rawOptions, 'aiModel');

	return {
		model: resolveGonkaGateModelId(input.node, input.rawModel, input.itemIndex),
		stream: input.rawStreaming,
		requestBodyOptions,
		aiModelOptions,
	};
}
