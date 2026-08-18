import type { IDisplayOptions, ILoadOptionsFunctions, INodeProperties } from 'n8n-workflow';

import { GONKAGATE_MODEL_SEARCH_METHOD_NAME } from './identifiers';
import { searchGonkaGateModels } from './modelDiscovery';
import { GONKAGATE_MODEL_PARAMETER_NAME } from './parameters';

// A node property default must be a static value in the descriptor, so it can
// never carry a live model id. The descriptor therefore defaults to an empty
// selection and the live catalog owns the effective default at run time.
export const GONKAGATE_MODEL_SELECTOR_DEFAULT = {
	mode: 'list',
	value: '',
} as const;

const GONKAGATE_MODEL_ID_PLACEHOLDER = 'provider/model-id';

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
		name: GONKAGATE_MODEL_PARAMETER_NAME,
		type: 'resourceLocator',
		default: { ...GONKAGATE_MODEL_SELECTOR_DEFAULT },
		// A model is always required on the wire, but n8n reports an empty
		// required resourceLocator as a blocking node issue. Keeping this
		// optional in the descriptor is what lets an empty selection fall through
		// to the live default; execution still fails with `Model ID is required`
		// when no model can be resolved.
		required: false,
		displayOptions,
		description:
			'Select a live GonkaGate model from GET /v1/models, or switch to ID mode to enter one manually. Leave it empty to use the first model GonkaGate returns.',
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
				placeholder: GONKAGATE_MODEL_ID_PLACEHOLDER,
			},
		],
	};
}

export const GONKAGATE_MODEL_SELECTOR_METHODS = createGonkaGateModelSearchMethods();

export const GONKAGATE_MODEL_SELECTOR_PROPERTY = createGonkaGateModelSelectorProperty();
