import assert from 'node:assert/strict';
import test from 'node:test';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	buildGonkaGateChatModelOptions,
	createGonkaGateChatModelOptionsProperty,
	normalizeGonkaGateError,
	parseGonkaGateModelsResponse,
	resolveGonkaGateBaseUrl,
	resolveGonkaGateModelId,
	searchGonkaGateModels,
	serializeGonkaGateError,
	buildGonkaGateModelSearchResults,
} from '../nodes/shared/GonkaGate';
import {
	createLoadOptionsContext,
	createModelResourceLocator,
	createNode,
} from './helpers/gonkagateTestUtils';

test('parseGonkaGateModelsResponse sorts active models before deprecated ones', () => {
	const models = parseGonkaGateModelsResponse({
		data: [
			{ id: 'legacy-model', deprecated: true, created: 10 },
			{ id: 'new-model', created: 30 },
			{ id: 'older-active-model', created: 20 },
			{ id: 'missing-id' },
			{ created: 40 },
		],
	});

	assert.deepEqual(
		models.map((model) => model.id),
		['new-model', 'older-active-model', 'missing-id', 'legacy-model'],
	);
});

test('buildGonkaGateModelSearchResults keeps rich labels and filters by metadata', () => {
	const results = buildGonkaGateModelSearchResults(
		parseGonkaGateModelsResponse({
			data: [
				{
					id: 'gonka/text-fast',
					name: 'Fast Text',
					description: 'General purpose text model',
					context_length: 128000,
					pricing: {
						prompt: '$0.10',
						completion: '$0.20',
					},
				},
				{
					id: 'gonka/reasoning-pro',
					description: 'Reasoning-focused model',
					provider: 'GonkaGate',
				},
			],
		}),
		'reasoning',
	);

	assert.equal(results.length, 1);
	assert.equal(results[0].name, 'gonka/reasoning-pro');
	assert.match(results[0].description ?? '', /Reasoning-focused model/);
});

test('resolveGonkaGateModelId accepts manual strings and resource locator values', () => {
	assert.equal(resolveGonkaGateModelId(createNode(), ' direct-model ', 0), 'direct-model');
	assert.equal(
		resolveGonkaGateModelId(createNode(), createModelResourceLocator('picked-model'), 0),
		'picked-model',
	);
});

test('resolveGonkaGateBaseUrl rejects the legacy placeholder', () => {
	assert.throws(() => resolveGonkaGateBaseUrl('__GONKAGATE_BASE_URL_UNRESOLVED__'));
	assert.equal(
		resolveGonkaGateBaseUrl(' https://api.gonkagate.com/v1 '),
		'https://api.gonkagate.com/v1',
	);
});

test('buildGonkaGateChatModelOptions stays in sync with the AI node options property', () => {
	const property = createGonkaGateChatModelOptionsProperty();
	const options = buildGonkaGateChatModelOptions({
		frequencyPenalty: 0.1,
		maxRetries: 1,
		maxTokens: 256,
		presencePenalty: 0.2,
		temperature: 0.3,
		timeout: 1000,
		topP: 0.4,
	});

	assert.deepEqual(
		Object.keys(options).sort(),
		(property.options ?? []).map((option) => option.name).sort(),
	);
});

test('searchGonkaGateModels falls back to an empty list for recoverable upstream failures', async () => {
	const results = await searchGonkaGateModels.call(
		createLoadOptionsContext({
			credentialsSelected: true,
			httpRequest: async () => {
				throw {
					response: {
						status: 503,
						data: {
							message: 'temporarily unavailable',
						},
					},
				};
			},
		}),
		'',
	);

	assert.deepEqual(results, { results: [] });
});

test('searchGonkaGateModels surfaces credential or contract failures instead of hiding them', async () => {
	await assert.rejects(
		searchGonkaGateModels.call(
			createLoadOptionsContext({
				credentialsSelected: true,
				httpRequest: async () => {
					throw {
						response: {
							status: 401,
							data: {
								message: 'unauthorized',
							},
						},
					};
				},
			}),
			'',
		),
		(error) =>
			error instanceof NodeApiError &&
			/Authorization failed|check your credentials/.test(error.message),
	);
});

test('searchGonkaGateModels rethrows unexpected internal errors', async () => {
	await assert.rejects(
		searchGonkaGateModels.call(
			createLoadOptionsContext({
				credentialsSelected: true,
				httpRequest: async () => {
					const response = {};
					Object.defineProperty(response, 'data', {
						get() {
							throw new TypeError('unexpected parser failure');
						},
					});
					return response;
				},
			}),
			'',
		),
		/unexpected parser failure/,
	);
});

test('searchGonkaGateModels rethrows normalized internal node errors', async () => {
	await assert.rejects(
		searchGonkaGateModels.call(
			createLoadOptionsContext({
				credentialsSelected: true,
				httpRequest: async () => {
					throw new NodeOperationError(createNode(), 'internal parse failure');
				},
			}),
			'',
		),
		/internal parse failure/,
	);
});

test('serializeGonkaGateError keeps normalized request metadata for continueOnFail output', () => {
	const error = normalizeGonkaGateError(
		createNode(),
		{
			code: 'ETIMEDOUT',
			message: 'socket timed out',
			response: {
				headers: {
					'x-request-id': 'req_123',
				},
				data: {
					message: 'socket timed out',
				},
			},
		},
		2,
		'Chat Completion',
	);

	assert.deepEqual(serializeGonkaGateError(error), {
		error: 'The GonkaGate request timed out',
		description: 'socket timed out\nRequest ID: req_123',
		requestId: 'req_123',
	});
});

test('normalizeGonkaGateError keeps recoverable metadata outside framework error objects', () => {
	const error = normalizeGonkaGateError(
		createNode(),
		{
			code: 'ETIMEDOUT',
			message: 'socket timed out',
			response: {
				headers: {
					'x-request-id': 'req_456',
				},
				data: {
					message: 'socket timed out',
				},
			},
		},
		0,
		'Chat Completion',
	);

	assert.equal(error.context.requestId, undefined);
	assert.equal((error.context as { recoverable?: boolean }).recoverable, undefined);
	assert.deepEqual(serializeGonkaGateError(error), {
		error: 'The GonkaGate request timed out',
		description: 'socket timed out\nRequest ID: req_456',
		requestId: 'req_456',
	});
});
