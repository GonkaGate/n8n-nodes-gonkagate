import type { INodeParameterResourceLocator } from 'n8n-workflow';

export function readResourceLocatorValue(value: unknown): string | undefined {
	if (!isResourceLocatorValue(value) || value.value === undefined) {
		return undefined;
	}

	const resolvedValue = String(value.value).trim();

	return resolvedValue.length > 0 ? resolvedValue : undefined;
}

function isResourceLocatorValue(value: unknown): value is INodeParameterResourceLocator {
	return isRecord(value) && value.__rl === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
