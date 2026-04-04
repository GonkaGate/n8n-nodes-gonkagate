import assert from 'node:assert/strict';
import test from 'node:test';

import type { ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	buildGonkaGateModelSearchResults,
	searchGonkaGateModels,
} from '../shared/GonkaGate/modelDiscovery';
import { resolveGonkaGateModelId } from '../shared/GonkaGate/modelId';
import { parseGonkaGateModelsResponse } from '../shared/GonkaGate/modelsApi';
import { createLoadOptionsContext } from './helpers/createLoadOptionsContext';
import { createModelResourceLocator, createTestNode } from './helpers/createTestNode';

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
	assert.equal(resolveGonkaGateModelId(createTestNode(), ' direct-model ', 0), 'direct-model');
	assert.equal(
		resolveGonkaGateModelId(createTestNode(), createModelResourceLocator('picked-model'), 0),
		'picked-model',
	);
});

test('searchGonkaGateModels falls back to an empty list for recoverable upstream failures', async () => {
	const results = await searchModels(async () => {
		throw {
			response: {
				status: 503,
				data: {
					message: 'temporarily unavailable',
				},
			},
		};
	});

	assert.deepEqual(results, { results: [] });
});

test('searchGonkaGateModels surfaces credential failures instead of hiding them', async () => {
	await assert.rejects(
		searchModels(async () => {
			throw {
				response: {
					status: 401,
					data: {
						message: 'unauthorized',
					},
				},
			};
		}),
		(error) =>
			error instanceof NodeApiError &&
			/Authorization failed|check your credentials/.test(error.message),
	);
});

test('searchGonkaGateModels surfaces malformed models payloads instead of hiding them', async () => {
	await assert.rejects(
		searchModels(async () => ({
			data: {
				id: 'not-an-array',
			},
		})),
		/GonkaGate models response must contain a data array/,
	);
});

test('searchGonkaGateModels rethrows unexpected internal errors', async () => {
	await assert.rejects(
		searchModels(async () => {
			const response = {};
			Object.defineProperty(response, 'data', {
				get() {
					throw new TypeError('unexpected parser failure');
				},
			});

			return response;
		}),
		/unexpected parser failure/,
	);
});

test('searchGonkaGateModels rethrows normalized internal node errors', async () => {
	await assert.rejects(
		searchModels(async () => {
			throw new NodeOperationError(createTestNode(), 'internal parse failure');
		}),
		/internal parse failure/,
	);
});

test('searchGonkaGateModels suppresses pre-normalized recoverable API errors', async () => {
	const results = await searchModels(async () => {
		throw new NodeApiError(createTestNode(), {
			status: 503,
			data: {
				message: 'temporarily unavailable',
			},
		});
	});

	assert.deepEqual(results, { results: [] });
});

async function searchModels(
	authenticatedHttpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'],
) {
	return await searchGonkaGateModels.call(
		createLoadOptionsContext({
			credentialsAttached: true,
			authenticatedHttpRequest,
		}),
		'',
	);
}
