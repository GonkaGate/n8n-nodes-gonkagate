import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { fetchGonkaGateDefaultModelId } from './modelsApi';
import type { GonkaGateRequestContext } from './request';
import { readResourceLocatorValue } from './resourceLocator';

function readGonkaGateModelIdValue(rawModel: unknown): string {
	return (
		readResourceLocatorValue(rawModel) ?? (typeof rawModel === 'string' ? rawModel.trim() : '')
	);
}

export function resolveGonkaGateModelId(node: INode, rawModel: unknown, itemIndex: number): string {
	const model = readGonkaGateModelIdValue(rawModel);

	if (model.length === 0) {
		throw createMissingGonkaGateModelError(node, itemIndex);
	}

	return model;
}

/**
 * Resolves the model an item should run against. An explicit selection always
 * wins. When the `Model` parameter is left empty, the live catalog supplies the
 * default so the package never ships a checked-in model id.
 */
export async function resolveGonkaGateModelIdWithLiveDefault(
	context: GonkaGateRequestContext,
	rawModel: unknown,
	itemIndex: number,
): Promise<string> {
	const selectedModel = readGonkaGateModelIdValue(rawModel);

	if (selectedModel.length > 0) {
		return selectedModel;
	}

	const defaultModelId = await fetchGonkaGateDefaultModelIdOnce(context, itemIndex);

	if (defaultModelId === undefined) {
		throw createMissingGonkaGateModelError(context.getNode(), itemIndex);
	}

	return defaultModelId;
}

const liveDefaultModelIdByContext = new WeakMap<object, Promise<string | undefined>>();

function fetchGonkaGateDefaultModelIdOnce(
	context: GonkaGateRequestContext,
	itemIndex: number,
): Promise<string | undefined> {
	const cachedLookup = liveDefaultModelIdByContext.get(context);

	if (cachedLookup !== undefined) {
		return cachedLookup;
	}

	// n8n hands one context to a whole execution, so resolving the live default
	// once keeps a multi-item run from issuing GET /v1/models per item and keeps
	// every item of that run on the same default model.
	const lookup = fetchGonkaGateDefaultModelId(context, { itemIndex });

	liveDefaultModelIdByContext.set(context, lookup);

	return lookup.catch((error: unknown) => {
		// A failed lookup must not pin later items of the same run to the failure.
		liveDefaultModelIdByContext.delete(context);

		throw error;
	});
}

function createMissingGonkaGateModelError(node: INode, itemIndex: number): NodeOperationError {
	return new NodeOperationError(node, 'Model ID is required', {
		itemIndex,
		description:
			'Select a model from the live list, or switch to ID mode and enter a Model ID manually. Leaving Model empty uses the first model from GET /v1/models, which needs a non-empty live catalog.',
	});
}
