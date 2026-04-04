import type { ICredentialDataDecryptedObject, IHttpRequestOptions, INode } from 'n8n-workflow';

import {
	GONKAGATE_BASE_URL_MIGRATION_MESSAGE,
	LEGACY_GONKAGATE_BASE_URL_PLACEHOLDER,
} from './constants';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';
import { toGonkaGateNodeOperationError } from './errors';
import { createGonkaGateListModelsRequestOptions } from './modelsApi';
import {
	applyGonkaGateConnectionToRequest,
	buildGonkaGateRequestOptions,
	buildGonkaGateDefaultHeaders,
	type GonkaGateConnectionConfig,
} from './transport';

export type GonkaGateCredentialData = {
	apiKey?: string;
	baseUrl?: string;
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

export function resolveGonkaGateConnectionConfig(
	credentials: GonkaGateCredentialData,
): GonkaGateConnectionConfig {
	const baseUrl = resolveGonkaGateBaseUrl(credentials.baseUrl ?? credentials.url);
	const apiKey = resolveGonkaGateApiKey(credentials.apiKey);

	return {
		baseUrl,
		apiKey,
		defaultHeaders: buildGonkaGateDefaultHeaders(),
	};
}

export function resolveRequiredGonkaGateApiKey(
	node: INode,
	rawApiKey: unknown,
	itemIndex: number,
): string {
	try {
		return resolveGonkaGateApiKey(rawApiKey);
	} catch (error) {
		throw toGonkaGateNodeOperationError(node, error, itemIndex);
	}
}

export function hasGonkaGateCredential(node: Pick<INode, 'credentials'>): boolean {
	return node.credentials?.[GONKAGATE_CREDENTIAL_NAME] !== undefined;
}

export function resolveRequiredGonkaGateConnectionConfig(
	node: INode,
	credentials: GonkaGateCredentialData,
	itemIndex: number,
): GonkaGateConnectionConfig {
	try {
		return resolveGonkaGateConnectionConfig(credentials);
	} catch (error) {
		throw toGonkaGateNodeOperationError(node, error, itemIndex);
	}
}

export async function authenticateGonkaGateRequest(
	credentials: ICredentialDataDecryptedObject,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	return applyGonkaGateConnectionToRequest(
		resolveGonkaGateConnectionConfig(credentials),
		requestOptions,
	);
}

export function createGonkaGateCredentialTestRequest(): IHttpRequestOptions {
	return buildGonkaGateRequestOptions(createGonkaGateListModelsRequestOptions());
}
