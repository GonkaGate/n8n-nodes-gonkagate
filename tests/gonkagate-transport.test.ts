import assert from 'node:assert/strict';
import test from 'node:test';

import {
	applyGonkaGateConnectionToRequest,
	buildGonkaGateRequestOptions,
	createGonkaGateAiModelConnection,
} from '../shared/GonkaGate/transport';
import { parseGonkaGateDataObjectResponse } from '../shared/GonkaGate/request';

test('buildGonkaGateRequestOptions owns the shared JSON request defaults', () => {
	const result = buildGonkaGateRequestOptions({
		method: 'POST',
		url: '/chat/completions',
		body: {
			model: 'test-model',
		},
		headers: {
			'X-Test': '1',
		},
	});

	assert.deepEqual(result, {
		method: 'POST',
		url: '/chat/completions',
		body: {
			model: 'test-model',
		},
		json: true,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			'X-Test': '1',
		},
	});
});

test('applyGonkaGateConnectionToRequest reuses the shared transport contract', () => {
	const result = applyGonkaGateConnectionToRequest(
		{
			baseUrl: 'https://api.gonkagate.com/v1',
			apiKey: 'test-key',
			defaultHeaders: {
				Accept: 'application/json',
				'X-Provider': 'gonkagate',
			},
		},
		{
			url: '/models',
			headers: {
				'X-Test': '1',
			},
		},
	);

	assert.deepEqual(result, {
		baseURL: 'https://api.gonkagate.com/v1',
		url: '/models',
		headers: {
			Accept: 'application/json',
			'X-Provider': 'gonkagate',
			'X-Test': '1',
			Authorization: 'Bearer test-key',
		},
	});
});

test('createGonkaGateAiModelConnection reuses the shared provider transport defaults', () => {
	const result = createGonkaGateAiModelConnection({
		baseUrl: 'https://api.gonkagate.com/v1',
		apiKey: 'test-key',
		defaultHeaders: {
			Accept: 'application/json',
		},
	});

	assert.deepEqual(result, {
		baseUrl: 'https://api.gonkagate.com/v1',
		apiKey: 'test-key',
		defaultHeaders: {
			Accept: 'application/json',
		},
	});
});

test('parseGonkaGateDataObjectResponse rejects non-object payloads at the request boundary', () => {
	assert.throws(
		() => parseGonkaGateDataObjectResponse([]),
		/GonkaGate response must be a JSON object/,
	);
});
