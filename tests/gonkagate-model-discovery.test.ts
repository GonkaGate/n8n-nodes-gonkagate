import assert from 'node:assert/strict';
import test from 'node:test';

import type { ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import {
	buildGonkaGateModelSearchResults,
	searchGonkaGateModels,
} from '../shared/GonkaGate/modelDiscovery';
import {
	buildGonkaGateModelDisplayDescription,
	buildGonkaGateModelDisplayName,
	matchesGonkaGateModelFilter,
} from '../shared/GonkaGate/modelCatalog';
import { resolveGonkaGateModelId } from '../shared/GonkaGate/modelId';
import { parseGonkaGateModelCatalog } from '../shared/GonkaGate/modelsApi';
import { createLoadOptionsContext } from './helpers/createLoadOptionsContext';
import { createModelResourceLocator, createTestNode } from './helpers/createTestNode';

test('parseGonkaGateModelCatalog sorts active models before deprecated ones', () => {
	const models = parseGonkaGateModelCatalog({
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
		parseGonkaGateModelCatalog({
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

test('model catalog helpers own selector presentation and filtering metadata', () => {
	const [model] = parseGonkaGateModelCatalog({
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
				provider: 'GonkaGate',
			},
		],
	});

	assert.equal(buildGonkaGateModelDisplayName(model), 'Fast Text (gonka/text-fast)');
	assert.equal(
		buildGonkaGateModelDisplayDescription(model),
		'Context 128k | Prompt $0.10 / Completion $0.20 | General purpose text model',
	);
	assert.equal(matchesGonkaGateModelFilter(model, 'gonkagate'), true);
	assert.equal(matchesGonkaGateModelFilter(model, 'image'), false);
});

test('resolveGonkaGateModelId accepts manual strings and resource locator values', () => {
	assert.equal(resolveGonkaGateModelId(createTestNode(), ' direct-model ', 0), 'direct-model');
	assert.equal(
		resolveGonkaGateModelId(createTestNode(), createModelResourceLocator('picked-model'), 0),
		'picked-model',
	);
});

test('resolveGonkaGateModelId rejects malformed resource locator payloads', () => {
	assert.throws(
		() =>
			resolveGonkaGateModelId(
				createTestNode(),
				{
					__rl: true,
					mode: 'id',
					value: {
						id: 'invalid-model',
					},
				},
				0,
			),
		/Model ID is required/,
	);
});

test('searchGonkaGateModels falls back to an empty list for recoverable upstream failures', async () => {
	const results = await searchGonkaGateModelsWithContext(async () => {
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
		searchGonkaGateModelsWithContext(async () => {
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
		searchGonkaGateModelsWithContext(async () => ({
			data: {
				id: 'not-an-array',
			},
		})),
		/GonkaGate models response must contain a data array/,
	);
});

test('searchGonkaGateModels rethrows unexpected internal errors', async () => {
	await assert.rejects(
		searchGonkaGateModelsWithContext(async () => {
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
		searchGonkaGateModelsWithContext(async () => {
			throw new NodeOperationError(createTestNode(), 'internal parse failure');
		}),
		/internal parse failure/,
	);
});

test('searchGonkaGateModels suppresses pre-normalized recoverable API errors', async () => {
	const results = await searchGonkaGateModelsWithContext(async () => {
		throw new NodeApiError(createTestNode(), {
			status: 503,
			data: {
				message: 'temporarily unavailable',
			},
		});
	});

	assert.deepEqual(results, { results: [] });
});

async function searchGonkaGateModelsWithContext(
	httpRequestWithAuthentication: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'],
) {
	return await searchGonkaGateModels.call(
		createLoadOptionsContext({
			hasCredentials: true,
			httpRequestWithAuthentication,
		}),
		'',
	);
}
