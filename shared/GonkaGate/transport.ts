import type { IHttpRequestOptions } from 'n8n-workflow';

export type GonkaGateHeaders = Record<string, string>;

export type GonkaGateConnectionConfig = {
	baseUrl: string;
	apiKey: string;
	defaultHeaders: GonkaGateHeaders;
};

export type GonkaGateAiModelConnection = Pick<
	GonkaGateConnectionConfig,
	'baseUrl' | 'apiKey' | 'defaultHeaders'
>;

export type GonkaGateRequestOptions = IHttpRequestOptions & {
	json?: boolean;
};

export function buildGonkaGateDefaultHeaders(headers: GonkaGateHeaders = {}): GonkaGateHeaders {
	return {
		Accept: 'application/json',
		...headers,
	};
}

export function buildGonkaGateRequestOptions(
	requestOptions: GonkaGateRequestOptions,
): GonkaGateRequestOptions {
	const { body, headers, json = true, ...restRequestOptions } = requestOptions;
	const normalizedHeaders = normalizeHeaders(headers);

	return {
		...restRequestOptions,
		...(body !== undefined ? { body } : {}),
		json,
		headers: buildGonkaGateRequestHeaders({
			headers: normalizedHeaders,
			body,
			json,
		}),
	};
}

export function applyGonkaGateConnectionToRequest(
	connection: GonkaGateConnectionConfig,
	requestOptions: IHttpRequestOptions,
): IHttpRequestOptions {
	const mergedHeaders = {
		...buildGonkaGateDefaultHeaders({
			...normalizeHeaders(connection.defaultHeaders),
			...normalizeHeaders(requestOptions.headers),
		}),
		Authorization: `Bearer ${connection.apiKey}`,
	};

	requestOptions.baseURL = requestOptions.baseURL ?? connection.baseUrl;
	requestOptions.headers = mergedHeaders;

	return requestOptions;
}

export function createGonkaGateAiModelConnection(
	connection: GonkaGateConnectionConfig,
): GonkaGateAiModelConnection {
	return {
		baseUrl: connection.baseUrl,
		apiKey: connection.apiKey,
		defaultHeaders: buildGonkaGateDefaultHeaders(connection.defaultHeaders),
	};
}

function buildGonkaGateRequestHeaders(input: {
	headers: GonkaGateHeaders;
	body?: unknown;
	json: boolean;
}): GonkaGateHeaders {
	return buildGonkaGateDefaultHeaders({
		...(input.body !== undefined && input.json ? { 'Content-Type': 'application/json' } : {}),
		...input.headers,
	});
}

function normalizeHeaders(headers: IHttpRequestOptions['headers']): GonkaGateHeaders {
	if (headers === undefined || headers === null) {
		return {};
	}

	const normalizedHeaders: GonkaGateHeaders = {};

	for (const [key, value] of Object.entries(headers)) {
		if (typeof value === 'string') {
			normalizedHeaders[key] = value;
		}
	}

	return normalizedHeaders;
}
