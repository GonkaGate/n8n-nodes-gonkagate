import type { IDataObject } from 'n8n-workflow';

import { parseGonkaGateDataObjectResponse } from './request';

export type GonkaGateModelsResponse = IDataObject & {
	data: unknown[];
};

export type GonkaGateModelRecord = IDataObject & {
	id: string;
	name?: string;
	description?: string;
	pricing?: Record<string, unknown>;
	created?: number;
};

export function parseGonkaGateModelCatalog(
	response: GonkaGateModelsResponse,
): GonkaGateModelRecord[] {
	// GET /v1/models owns catalog order. The first usable entry is the default
	// model for both node surfaces, so the client must not re-rank the list.
	return response.data
		.filter(isRecord)
		.map((model) => toModelRecord(model))
		.filter((model): model is GonkaGateModelRecord => model !== null);
}

export function buildGonkaGateModelDisplayName(model: GonkaGateModelRecord): string {
	if (model.name !== undefined && model.name !== model.id) {
		return `${model.name} (${model.id})`;
	}

	return model.id;
}

export function buildGonkaGateModelDisplayDescription(
	model: GonkaGateModelRecord,
): string | undefined {
	const parts = [
		formatContextLength(model),
		formatPricing(model.pricing),
		truncate(model.description, 140),
	].filter((part): part is string => part !== undefined && part.length > 0);

	return parts.length > 0 ? parts.join(' | ') : undefined;
}

export function matchesGonkaGateModelFilter(
	model: GonkaGateModelRecord,
	filter: string | undefined,
): boolean {
	const normalizedFilter = filter?.trim().toLowerCase() ?? '';

	if (normalizedFilter.length === 0) {
		return true;
	}

	return getModelSearchValues(model).some((value) =>
		value.toLowerCase().includes(normalizedFilter),
	);
}

function toModelRecord(model: Record<string, unknown>): GonkaGateModelRecord | null {
	const id = typeof model.id === 'string' ? model.id.trim() : '';

	if (id.length === 0) {
		return null;
	}

	// Older gateways omit the optional catalog metadata entirely and newer ones
	// may send `null` for it. Keep the declared optional fields out of the raw
	// passthrough so a `null` can never survive behind an optional typed field,
	// then add back only the values that are usable.
	const { name, description, created, pricing, ...passthroughFields } = model;
	const record: GonkaGateModelRecord = {
		...passthroughFields,
		id,
	};
	const modelName = readNonEmptyString(name);
	const modelDescription = readNonEmptyString(description);
	const modelCreated = readFiniteNumber(created);

	if (modelName !== undefined) {
		record.name = modelName;
	}

	if (modelDescription !== undefined) {
		record.description = modelDescription;
	}

	if (modelCreated !== undefined) {
		record.created = modelCreated;
	}

	if (isRecord(pricing)) {
		record.pricing = parseGonkaGateDataObjectResponse(pricing);
	}

	return record;
}

function readNonEmptyString(value: unknown): string | undefined {
	if (typeof value !== 'string') {
		return undefined;
	}

	const trimmedValue = value.trim();

	return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function readFiniteNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getModelSearchValues(model: GonkaGateModelRecord): string[] {
	return [
		model.id,
		model.name,
		model.description,
		getStringValue(model, 'owned_by'),
		getStringValue(model, 'provider'),
	].filter((value): value is string => typeof value === 'string' && value.length > 0);
}

const CONTEXT_LENGTH_KEYS = [
	'context_length',
	'contextLength',
	'context_window',
	'contextWindow',
	'max_context_tokens',
	'maxContextTokens',
] as const;

function formatContextLength(model: GonkaGateModelRecord): string | undefined {
	// Gateways that predate the enriched catalog send none of these keys, and a
	// gateway that knows no context window may send `null` or `0`. Only a
	// positive number describes a real context window worth showing.
	const contextLength = CONTEXT_LENGTH_KEYS.map((key) => readFiniteNumber(model[key])).find(
		(value) => value !== undefined && value > 0,
	);

	if (contextLength === undefined) {
		return undefined;
	}

	if (contextLength >= 1000) {
		return `Context ${Math.round(contextLength / 100) / 10}k`;
	}

	return `Context ${contextLength}`;
}

function formatPricing(pricing: Record<string, unknown> | undefined): string | undefined {
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

function getStringValue(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key];

	return typeof value === 'string' && value.length > 0 ? value : undefined;
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
