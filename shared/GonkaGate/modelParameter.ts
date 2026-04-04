import type { IDisplayOptions, ILoadOptionsFunctions, INodeProperties } from 'n8n-workflow';

import { GONKAGATE_MODEL_SEARCH_METHOD_NAME } from './identifiers';
import { searchGonkaGateModels } from './modelDiscovery';

export function createGonkaGateModelSearchMethods() {
	return {
		listSearch: {
			async [GONKAGATE_MODEL_SEARCH_METHOD_NAME](this: ILoadOptionsFunctions, filter?: string) {
				return await searchGonkaGateModels.call(this, filter);
			},
		},
	};
}

export function createGonkaGateModelSelectorProperty(
	displayOptions?: IDisplayOptions,
): INodeProperties {
	return {
		displayName: 'Model',
		name: 'model',
		type: 'resourceLocator',
		default: {
			mode: 'list',
			value: '',
		},
		required: true,
		displayOptions,
		description:
			'Select a live GonkaGate model from GET /v1/models or switch to ID mode to enter one manually',
		hint: 'Use ID mode if live discovery is empty, unavailable, or you need a model not shown in the current list.',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a GonkaGate model...',
				typeOptions: {
					searchListMethod: GONKAGATE_MODEL_SEARCH_METHOD_NAME,
					searchable: true,
					searchFilterRequired: false,
					skipCredentialsCheckInRLC: true,
					slowLoadNotice: {
						message:
							'If live model loading takes too long or returns nothing, switch to ID mode and enter a Model ID manually',
						timeout: 3000,
					},
				},
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'model-ID',
			},
		],
	};
}
