import type { INodeParameterResourceLocator } from 'n8n-workflow';

export function readResourceLocatorValue(value: unknown): string | undefined {
	if (!isResourceLocatorValue(value)) {
		return undefined;
	}

	return normalizeResourceLocatorValue(value.value);
}

function isResourceLocatorValue(value: unknown): value is INodeParameterResourceLocator {
	return isRecord(value) && value.__rl === true;
}

function normalizeResourceLocatorValue(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmedValue = value.trim();

		return trimmedValue.length > 0 ? trimmedValue : undefined;
	}

	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value);
	}

	return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
