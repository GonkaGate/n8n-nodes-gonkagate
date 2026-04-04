import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';

import { GONKAGATE_MODELS_PATH } from './constants';
import { parseGonkaGateDataObjectResponse } from './request';
import { buildGonkaGateRequestOptions } from './transport';

export type GonkaGateModelsResponse = IDataObject & {
	data?: unknown;
};

export function createListModelsRequestOptions(): IHttpRequestOptions {
	return buildGonkaGateRequestOptions({
		method: 'GET',
		url: GONKAGATE_MODELS_PATH,
	});
}

export function parseGonkaGateModelsApiResponse(response: unknown): GonkaGateModelsResponse {
	return parseGonkaGateDataObjectResponse<GonkaGateModelsResponse>(response);
}
