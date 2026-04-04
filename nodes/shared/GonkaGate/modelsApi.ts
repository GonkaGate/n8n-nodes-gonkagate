import type { IDataObject, IHttpRequestOptions } from 'n8n-workflow';

import { GONKAGATE_MODELS_PATH } from './constants';

export type GonkaGateModelsResponse = IDataObject & {
	data?: unknown;
};

export function createListModelsRequestOptions(): IHttpRequestOptions {
	return {
		method: 'GET',
		url: GONKAGATE_MODELS_PATH,
	};
}
