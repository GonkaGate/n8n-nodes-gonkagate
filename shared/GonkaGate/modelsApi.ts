import { GONKAGATE_MODELS_PATH } from './constants';
import {
	parseGonkaGateModelCatalog,
	type GonkaGateModelRecord,
	type GonkaGateModelsResponse,
} from './modelCatalog';
import { GONKAGATE_LIST_MODELS_OPERATION_NAME } from './operationNames';
import { createGonkaGateEndpointRequester, parseGonkaGateDataObjectResponse } from './request';
import type { GonkaGateRequestOptions } from './transport';

export function createGonkaGateListModelsRequestOptions(): GonkaGateRequestOptions {
	return {
		method: 'GET',
		url: GONKAGATE_MODELS_PATH,
	};
}

export function parseGonkaGateModelsApiResponse(response: unknown): GonkaGateModelsResponse {
	const modelsResponse = parseGonkaGateDataObjectResponse(response);
	const data = modelsResponse.data;

	if (!Array.isArray(data)) {
		throw new Error('GonkaGate models response must contain a data array');
	}

	return {
		...modelsResponse,
		data,
	};
}

const requestGonkaGateModelsEndpoint = createGonkaGateEndpointRequester<GonkaGateModelsResponse>({
	operationName: GONKAGATE_LIST_MODELS_OPERATION_NAME,
	parseResponse: parseGonkaGateModelsApiResponse,
});

type GonkaGateModelsRequestContext = Parameters<typeof requestGonkaGateModelsEndpoint>[0];

export async function requestGonkaGateModelsResponse(
	context: GonkaGateModelsRequestContext,
	input: {
		itemIndex?: number;
	} = {},
): Promise<GonkaGateModelsResponse> {
	return await requestGonkaGateModelsEndpoint(context, createGonkaGateListModelsRequestOptions(), {
		itemIndex: input.itemIndex,
	});
}

export async function fetchGonkaGateModelCatalog(
	context: GonkaGateModelsRequestContext,
	input: {
		itemIndex?: number;
	} = {},
): Promise<GonkaGateModelRecord[]> {
	return parseGonkaGateModelCatalog(await requestGonkaGateModelsResponse(context, input));
}

/**
 * The default model is positional: the first usable entry of GET /v1/models in
 * response order. GonkaGate owns that order, so this package keeps no checked-in
 * default model id and applies no client-side ranking.
 */
export async function fetchGonkaGateDefaultModelId(
	context: GonkaGateModelsRequestContext,
	input: {
		itemIndex?: number;
	} = {},
): Promise<string | undefined> {
	const [defaultModel] = await fetchGonkaGateModelCatalog(context, input);

	return defaultModel?.id;
}

export {
	parseGonkaGateModelCatalog,
	type GonkaGateModelRecord,
	type GonkaGateModelsResponse,
} from './modelCatalog';
