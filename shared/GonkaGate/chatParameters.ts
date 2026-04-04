import type { IDataObject, INode } from 'n8n-workflow';

import {
	resolveGonkaGateChatOptions,
	type GonkaGateChatOptionValues,
} from './chatOptions';
import { resolveGonkaGateModelId } from './modelId';

export type ResolvedGonkaGateChatParameters = {
	model: string;
	stream: boolean;
	requestBodyOptions: GonkaGateChatOptionValues;
	aiModelOptions: GonkaGateChatOptionValues;
};

export function resolveGonkaGateChatParameters(input: {
	node: INode;
	rawModel: unknown;
	rawStreaming: boolean;
	rawOptions?: IDataObject;
	itemIndex: number;
}): ResolvedGonkaGateChatParameters {
	return {
		model: resolveGonkaGateModelId(input.node, input.rawModel, input.itemIndex),
		stream: input.rawStreaming,
		requestBodyOptions: resolveGonkaGateChatOptions(input.rawOptions, 'requestBody'),
		aiModelOptions: resolveGonkaGateChatOptions(input.rawOptions, 'aiModel'),
	};
}
