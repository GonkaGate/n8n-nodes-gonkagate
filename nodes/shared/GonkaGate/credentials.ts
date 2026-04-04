import type { INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	GONKAGATE_BASE_URL_MIGRATION_MESSAGE,
	LEGACY_GONKAGATE_BASE_URL_PLACEHOLDER,
} from './constants';

export type GonkaGateCredentialData = {
	apiKey?: string;
	url?: string;
};

export function resolveGonkaGateBaseUrl(rawUrl: unknown): string {
	const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';

	if (url.length === 0 || url === LEGACY_GONKAGATE_BASE_URL_PLACEHOLDER) {
		throw new Error(GONKAGATE_BASE_URL_MIGRATION_MESSAGE);
	}

	return url;
}

export function resolveGonkaGateApiKey(rawApiKey: unknown): string {
	const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : '';

	if (apiKey.length === 0) {
		throw new Error('API Key is required');
	}

	return apiKey;
}

export function resolveRequiredGonkaGateApiKey(
	node: INode,
	rawApiKey: unknown,
	itemIndex: number,
): string {
	try {
		return resolveGonkaGateApiKey(rawApiKey);
	} catch (error) {
		throw new NodeOperationError(node, error as Error, {
			itemIndex,
		});
	}
}
