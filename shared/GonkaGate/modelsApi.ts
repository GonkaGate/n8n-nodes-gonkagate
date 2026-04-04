import type { IDataObject } from 'n8n-workflow';

import { GONKAGATE_MODELS_PATH } from './constants';
import { GONKAGATE_LIST_MODELS_OPERATION_NAME } from './operationNames';
import { gonkaGateRequest, parseGonkaGateDataObjectResponse } from './request';
import type { GonkaGateRequestOptions } from './transport';

export type GonkaGateModelsResponse = IDataObject & {
	data: unknown[];
};

export function createListModelsRequestOptions(): GonkaGateRequestOptions {
	return {
		method: 'GET',
		url: GONKAGATE_MODELS_PATH,
	};
}

export function parseGonkaGateModelsApiResponse(response: unknown): GonkaGateModelsResponse {
	const modelsResponse = parseGonkaGateDataObjectResponse<IDataObject & { data?: unknown }>(response);

	if (!Array.isArray(modelsResponse.data)) {
		throw new Error('GonkaGate models response must contain a data array');
	}

	return modelsResponse as GonkaGateModelsResponse;
}

export type GonkaGateModelRecord = IDataObject & {
	id: string;
	name?: string;
	description?: string;
	pricing?: IDataObject;
	created?: number;
};

type GonkaGateModelsRequestContext = Parameters<typeof gonkaGateRequest>[0];

export async function requestGonkaGateModels(
	context: GonkaGateModelsRequestContext,
	input: {
		itemIndex?: number;
	} = {},
): Promise<GonkaGateModelsResponse> {
	return await gonkaGateRequest<GonkaGateModelsResponse>(
		context,
		GONKAGATE_LIST_MODELS_OPERATION_NAME,
		createListModelsRequestOptions(),
		{
			itemIndex: input.itemIndex,
			parseResponse: parseGonkaGateModelsApiResponse,
		},
	);
}

export async function fetchGonkaGateModels(
	context: GonkaGateModelsRequestContext,
	input: {
		itemIndex?: number;
	} = {},
): Promise<GonkaGateModelRecord[]> {
	return parseGonkaGateModelsResponse(await requestGonkaGateModels(context, input));
}

export function parseGonkaGateModelsResponse(
	response: GonkaGateModelsResponse,
): GonkaGateModelRecord[] {
	return response.data
		.filter(isRecord)
		.map((model) => toModelRecord(model))
		.filter((model): model is GonkaGateModelRecord => model !== null)
		.sort(compareModels);
}

function toModelRecord(model: Record<string, unknown>): GonkaGateModelRecord | null {
	const id = typeof model.id === 'string' ? model.id.trim() : '';

	if (id.length === 0) {
		return null;
	}

	const record: GonkaGateModelRecord = {
		...model,
		id,
	};

	if (typeof model.name === 'string' && model.name.trim().length > 0) {
		record.name = model.name.trim();
	}

	if (typeof model.description === 'string' && model.description.trim().length > 0) {
		record.description = model.description.trim();
	}

	if (typeof model.created === 'number' && Number.isFinite(model.created)) {
		record.created = model.created;
	}

	if (isRecord(model.pricing)) {
		record.pricing = model.pricing as IDataObject;
	}

	return record;
}

function compareModels(left: GonkaGateModelRecord, right: GonkaGateModelRecord): number {
	const leftDeprecated = getBooleanValue(left, 'deprecated') ? 1 : 0;
	const rightDeprecated = getBooleanValue(right, 'deprecated') ? 1 : 0;

	if (leftDeprecated !== rightDeprecated) {
		return leftDeprecated - rightDeprecated;
	}

	const createdDifference = (right.created ?? 0) - (left.created ?? 0);

	if (createdDifference !== 0) {
		return createdDifference;
	}

	return left.id.localeCompare(right.id);
}

function getBooleanValue(record: Record<string, unknown>, key: string): boolean | undefined {
	const value = record[key];

	return typeof value === 'boolean' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
