import type {
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { hasGonkaGateCredential } from './credentials';
import { isRecoverableGonkaGateError } from './errors';
import {
	buildGonkaGateModelDisplayDescription,
	buildGonkaGateModelDisplayName,
	matchesGonkaGateModelFilter,
} from './modelCatalog';
import { fetchGonkaGateModelCatalog, type GonkaGateModelRecord } from './modelsApi';

const MAX_MODEL_RESULTS = 100;

export async function searchGonkaGateModels(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	if (!hasGonkaGateCredential(this.getNode())) {
		return { results: [] };
	}

	try {
		const models = await fetchGonkaGateModelCatalog(this);

		return {
			results: buildGonkaGateModelSearchResults(models, filter),
		};
	} catch (error) {
		if (shouldSuppressDiscoveryError(error)) {
			// Discovery is a convenience layer. Returning an empty list keeps the
			// manual ID fallback usable when the live call fails, while internal
			// validation and parsing regressions still surface during development.
			return { results: [] };
		}

		throw error;
	}
}

function shouldSuppressDiscoveryError(error: unknown): boolean {
	if (!isRecoverableGonkaGateError(error)) {
		return false;
	}

	if (!(error instanceof NodeApiError)) {
		return true;
	}

	const httpCode = Number(error.httpCode);

	return Number.isFinite(httpCode) && (httpCode === 408 || httpCode === 429 || httpCode >= 500);
}

export function buildGonkaGateModelSearchResults(
	models: GonkaGateModelRecord[],
	filter: string | undefined,
): INodeListSearchItems[] {
	const filteredModels = models.filter((model) => matchesGonkaGateModelFilter(model, filter));

	return filteredModels.slice(0, MAX_MODEL_RESULTS).map((model) => ({
		name: buildGonkaGateModelDisplayName(model),
		value: model.id,
		description: buildGonkaGateModelDisplayDescription(model),
	}));
}
