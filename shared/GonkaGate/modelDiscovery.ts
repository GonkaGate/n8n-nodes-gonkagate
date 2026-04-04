import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { hasGonkaGateCredential } from './credentials';
import { isRecoverableGonkaGateError } from './errors';
import {
	createListModelsRequestOptions,
	parseGonkaGateModelsApiResponse,
	type GonkaGateModelsResponse,
} from './modelsApi';
import { GONKAGATE_LIST_MODELS_OPERATION_NAME } from './operationNames';
import { gonkaGateRequest } from './request';

export type GonkaGateModelRecord = IDataObject & {
	id: string;
	name?: string;
	description?: string;
	pricing?: IDataObject;
	created?: number;
};

const MAX_MODEL_RESULTS = 100;

export async function searchGonkaGateModels(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	if (!hasGonkaGateCredential(this.getNode())) {
		return { results: [] };
	}

	try {
		const models = await fetchGonkaGateModels(this);

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

export async function fetchGonkaGateModels(
	context: ILoadOptionsFunctions,
): Promise<GonkaGateModelRecord[]> {
	const response = await gonkaGateRequest<GonkaGateModelsResponse>(
		context,
		GONKAGATE_LIST_MODELS_OPERATION_NAME,
		createListModelsRequestOptions(),
		{
			parseResponse: parseGonkaGateModelsApiResponse,
		},
	);

	return parseGonkaGateModelsResponse(response);
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

export function parseGonkaGateModelsResponse(
	response: GonkaGateModelsResponse,
): GonkaGateModelRecord[] {
	if (!Array.isArray(response.data)) {
		throw new Error('GonkaGate models response must contain a data array');
	}

	return response.data
		.filter(isRecord)
		.map((model) => toModelRecord(model))
		.filter((model): model is GonkaGateModelRecord => model !== null)
		.sort(compareModels);
}

export function buildGonkaGateModelSearchResults(
	models: GonkaGateModelRecord[],
	filter: string | undefined,
): INodeListSearchItems[] {
	const normalizedFilter = filter?.trim().toLowerCase() ?? '';
	const filteredModels =
		normalizedFilter.length === 0
			? models
			: models.filter((model) => matchesModelFilter(model, normalizedFilter));

	return filteredModels.slice(0, MAX_MODEL_RESULTS).map((model) => ({
		name: buildModelSearchName(model),
		value: model.id,
		description: buildModelSearchDescription(model),
	}));
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

function matchesModelFilter(model: GonkaGateModelRecord, filter: string): boolean {
	return [
		model.id,
		model.name,
		model.description,
		getStringValue(model, 'owned_by'),
		getStringValue(model, 'provider'),
	]
		.filter((value): value is string => typeof value === 'string' && value.length > 0)
		.some((value) => value.toLowerCase().includes(filter));
}

function buildModelSearchName(model: GonkaGateModelRecord): string {
	if (model.name !== undefined && model.name !== model.id) {
		return `${model.name} (${model.id})`;
	}

	return model.id;
}

function buildModelSearchDescription(model: GonkaGateModelRecord): string | undefined {
	const parts = [
		formatContextLength(model),
		formatPricing(model.pricing),
		truncate(model.description, 140),
	].filter((part): part is string => part !== undefined && part.length > 0);

	return parts.length > 0 ? parts.join(' | ') : undefined;
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

function formatContextLength(model: GonkaGateModelRecord): string | undefined {
	const candidates = [
		getNumberValue(model, 'context_length'),
		getNumberValue(model, 'context_window'),
		getNumberValue(model, 'contextWindow'),
		getNumberValue(model, 'max_context_tokens'),
		getNumberValue(model, 'maxContextTokens'),
	];

	const contextLength = candidates.find((value) => value !== undefined);

	if (contextLength === undefined) {
		return undefined;
	}

	if (contextLength >= 1000) {
		return `Context ${Math.round(contextLength / 100) / 10}k`;
	}

	return `Context ${contextLength}`;
}

function formatPricing(pricing: IDataObject | undefined): string | undefined {
	if (pricing === undefined) {
		return undefined;
	}

	const prompt =
		getStringOrNumberValue(pricing, 'prompt') ?? getStringOrNumberValue(pricing, 'input');
	const completion =
		getStringOrNumberValue(pricing, 'completion') ?? getStringOrNumberValue(pricing, 'output');

	if (prompt === undefined && completion === undefined) {
		return undefined;
	}

	if (prompt !== undefined && completion !== undefined) {
		return `Prompt ${prompt} / Completion ${completion}`;
	}

	if (prompt !== undefined) {
		return `Prompt ${prompt}`;
	}

	return `Completion ${completion}`;
}

function truncate(value: string | undefined, maxLength: number): string | undefined {
	if (value === undefined || value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringValue(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key];

	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getBooleanValue(record: Record<string, unknown>, key: string): boolean | undefined {
	const value = record[key];

	return typeof value === 'boolean' ? value : undefined;
}

function getNumberValue(record: Record<string, unknown>, key: string): number | undefined {
	const value = record[key];

	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getStringOrNumberValue(
	record: Record<string, unknown>,
	key: string,
): string | number | undefined {
	const value = record[key];

	if (typeof value === 'string' && value.length > 0) {
		return value;
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	return undefined;
}
