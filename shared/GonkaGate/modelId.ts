import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { readResourceLocatorValue } from './resourceLocator';

export function resolveGonkaGateModelId(node: INode, rawModel: unknown, itemIndex: number): string {
	const model =
		readResourceLocatorValue(rawModel) ?? (typeof rawModel === 'string' ? rawModel.trim() : '');

	if (model.length === 0) {
		throw new NodeOperationError(node, 'Model ID is required', {
			itemIndex,
			description:
				'Select a model from the live list or switch to ID mode and enter a Model ID manually.',
		});
	}

	return model;
}
