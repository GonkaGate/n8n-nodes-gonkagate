import type { ICredentialDataDecryptedObject, IHttpRequestOptions, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	GONKAGATE_BASE_URL_MIGRATION_MESSAGE,
	LEGACY_GONKAGATE_BASE_URL_PLACEHOLDER,
} from './constants';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';

export type GonkaGateCredentialData = {
	apiKey?: string;
	url?: string;
};

export type GonkaGateConnectionConfig = {
	baseUrl: string;
	apiKey: string;
	defaultHeaders: Record<string, string>;
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

export function buildGonkaGateDefaultHeaders(
	headers: Record<string, string> = {},
): Record<string, string> {
	return {
		Accept: 'application/json',
		...headers,
	};
}

export function resolveGonkaGateConnectionConfig(
	credentials: GonkaGateCredentialData,
): GonkaGateConnectionConfig {
	return {
		baseUrl: resolveGonkaGateBaseUrl(credentials.url),
		apiKey: resolveGonkaGateApiKey(credentials.apiKey),
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
		throw new NodeOperationError(node, error as Error, {
			itemIndex,
		});
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
		throw new NodeOperationError(node, error as Error, {
			itemIndex,
		});
	}
}

export async function authenticateGonkaGateRequest(
	credentials: ICredentialDataDecryptedObject,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const connection = resolveGonkaGateConnectionConfig(credentials);

	requestOptions.baseURL = requestOptions.baseURL ?? connection.baseUrl;
	requestOptions.headers = {
		...connection.defaultHeaders,
		...(requestOptions.headers ?? {}),
		Authorization: `Bearer ${connection.apiKey}`,
	};

	return requestOptions;
}
