import type {
	IDisplayOptions,
	ILoadOptionsFunctions,
	INode,
	INodeParameterResourceLocator,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { searchGonkaGateModels } from './modelDiscovery';

export function createGonkaGateModelSearchMethods() {
	return {
		listSearch: {
			async searchModels(this: ILoadOptionsFunctions, filter?: string) {
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
					searchListMethod: 'searchModels',
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

export function resolveGonkaGateModelId(node: INode, rawModel: unknown, itemIndex: number): string {
	const model =
		isResourceLocatorValue(rawModel) && rawModel.value !== undefined
			? String(rawModel.value).trim()
			: typeof rawModel === 'string'
				? rawModel.trim()
				: '';

	if (model.length === 0) {
		throw new NodeOperationError(node, 'Model ID is required', {
			itemIndex,
			description:
				'Select a model from the live list or switch to ID mode and enter a Model ID manually.',
		});
	}

	return model;
}

function isResourceLocatorValue(value: unknown): value is INodeParameterResourceLocator {
	return isRecord(value) && value.__rl === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
