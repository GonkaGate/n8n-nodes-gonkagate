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
	return response.data
		.filter(isRecord)
		.map((model) => toModelRecord(model))
		.filter((model): model is GonkaGateModelRecord => model !== null)
		.sort(compareModels);
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

	return getModelSearchValues(model).some((value) => value.toLowerCase().includes(normalizedFilter));
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
		record.pricing = parseGonkaGateDataObjectResponse(model.pricing);
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

function getModelSearchValues(model: GonkaGateModelRecord): string[] {
	return [
		model.id,
		model.name,
		model.description,
		getStringValue(model, 'owned_by'),
		getStringValue(model, 'provider'),
	].filter((value): value is string => typeof value === 'string' && value.length > 0);
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

function getBooleanValue(record: Record<string, unknown>, key: string): boolean | undefined {
	const value = record[key];

	return typeof value === 'boolean' ? value : undefined;
}

function getStringValue(record: Record<string, unknown>, key: string): string | undefined {
	const value = record[key];

	return typeof value === 'string' && value.length > 0 ? value : undefined;
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
