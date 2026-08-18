import assert from 'node:assert/strict';
import test from 'node:test';

import type { ILoadOptionsFunctions } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { GONKAGATE_MODELS_PATH } from '../shared/GonkaGate/constants';
import {
	buildGonkaGateModelSearchResults,
	searchGonkaGateModels,
} from '../shared/GonkaGate/modelDiscovery';
import {
	buildGonkaGateModelDisplayDescription,
	buildGonkaGateModelDisplayName,
	matchesGonkaGateModelFilter,
} from '../shared/GonkaGate/modelCatalog';
import {
	resolveGonkaGateModelId,
	resolveGonkaGateModelIdWithLiveDefault,
} from '../shared/GonkaGate/modelId';
import {
	fetchGonkaGateDefaultModelId,
	parseGonkaGateModelCatalog,
} from '../shared/GonkaGate/modelsApi';
import { createLoadOptionsContext } from './helpers/createLoadOptionsContext';
import { createModelResourceLocator, createTestNode } from './helpers/createTestNode';

test('parseGonkaGateModelCatalog preserves live catalog order and drops unusable entries', () => {
	const models = parseGonkaGateModelCatalog({
		data: [
			{ id: 'first-listed-model', created: 10 },
			{ created: 40 },
			{ id: 'second-listed-model', created: 30 },
			{ id: '   ' },
			{ id: 'third-listed-model' },
		],
	});

	assert.deepEqual(
		models.map((model) => model.id),
		['first-listed-model', 'second-listed-model', 'third-listed-model'],
	);
});

test('the default model is the first live catalog entry in response order', async () => {
	const requestedUrls: unknown[] = [];
	const context = createLoadOptionsContext({
		hasCredentials: true,
		async httpRequestWithAuthentication(_credentialType, requestOptions) {
			requestedUrls.push(requestOptions.url);

			return {
				object: 'list',
				data: [
					{ id: 'zzz-listed-first', object: 'model', created: 0, owned_by: 'gonka' },
					{ id: 'aaa-listed-second', object: 'model', created: 1753920000, owned_by: 'gonka' },
				],
			};
		},
	});

	assert.equal(await fetchGonkaGateDefaultModelId(context), 'zzz-listed-first');
	assert.equal(
		await resolveGonkaGateModelIdWithLiveDefault(context, createModelResourceLocator(''), 0),
		'zzz-listed-first',
	);
	// One direct catalog read plus one resolver read; the resolver then reuses the
	// per-run lookup instead of hitting GET /v1/models again for later items.
	assert.equal(
		await resolveGonkaGateModelIdWithLiveDefault(context, createModelResourceLocator(''), 1),
		'zzz-listed-first',
	);
	assert.deepEqual(requestedUrls, [GONKAGATE_MODELS_PATH, GONKAGATE_MODELS_PATH]);
});

test('a failed live default lookup does not pin later items to the failure', async () => {
	let catalogRequests = 0;
	const context = createLoadOptionsContext({
		hasCredentials: true,
		async httpRequestWithAuthentication() {
			catalogRequests += 1;

			if (catalogRequests === 1) {
				throw new Error('catalog temporarily unavailable');
			}

			return { object: 'list', data: [{ id: 'recovered-model' }] };
		},
	});

	await assert.rejects(
		resolveGonkaGateModelIdWithLiveDefault(context, createModelResourceLocator(''), 0),
		/catalog temporarily unavailable/,
	);
	assert.equal(
		await resolveGonkaGateModelIdWithLiveDefault(context, createModelResourceLocator(''), 1),
		'recovered-model',
	);
	assert.equal(catalogRequests, 2);
});

test('an explicit model selection never triggers a live catalog lookup', async () => {
	let catalogRequests = 0;
	const context = createLoadOptionsContext({
		hasCredentials: true,
		async httpRequestWithAuthentication() {
			catalogRequests += 1;

			return { object: 'list', data: [{ id: 'live-default-model' }] };
		},
	});

	assert.equal(
		await resolveGonkaGateModelIdWithLiveDefault(
			context,
			createModelResourceLocator(' picked-model '),
			0,
		),
		'picked-model',
	);
	assert.equal(
		await resolveGonkaGateModelIdWithLiveDefault(context, ' typed-model ', 0),
		'typed-model',
	);
	assert.equal(catalogRequests, 0);
});

test('an empty model with an empty live catalog fails with the manual-entry guidance', async () => {
	await assert.rejects(
		resolveGonkaGateModelIdWithLiveDefault(
			createLoadOptionsContext({
				hasCredentials: true,
				async httpRequestWithAuthentication() {
					return { object: 'list', data: [] };
				},
			}),
			createModelResourceLocator(''),
			0,
		),
		(error) =>
			error instanceof NodeOperationError &&
			error.message === 'Model ID is required' &&
			/switch to ID mode/.test(error.description ?? ''),
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

test('a gateway that only returns the base model fields still renders a usable list', () => {
	// Shape returned by gateways that have not shipped the enriched catalog yet:
	// no name, no description, no context_length.
	const results = buildGonkaGateModelSearchResults(
		parseGonkaGateModelCatalog({
			object: 'list',
			data: [{ id: 'gonka/text-fast', object: 'model', created: 0, owned_by: 'gonka' }],
		}),
		undefined,
	);

	assert.deepEqual(results, [
		{
			name: 'gonka/text-fast',
			value: 'gonka/text-fast',
			description: undefined,
		},
	]);
});

test('enriched catalog metadata is shown when the gateway sends it', () => {
	const [model] = parseGonkaGateModelCatalog({
		object: 'list',
		data: [
			{
				id: 'gonka/text-long',
				object: 'model',
				created: 1753920000,
				owned_by: 'gonka',
				name: 'Text Long',
				description: 'Long-context text model',
				context_length: 400000,
			},
		],
	});

	assert.equal(buildGonkaGateModelDisplayName(model), 'Text Long (gonka/text-long)');
	assert.equal(
		buildGonkaGateModelDisplayDescription(model),
		'Context 400k | Long-context text model',
	);
});

test('null and zero catalog metadata falls back instead of rendering placeholder values', () => {
	const [nulledModel, zeroContextModel] = parseGonkaGateModelCatalog({
		object: 'list',
		data: [
			{
				id: 'gonka/nulled',
				object: 'model',
				created: 0,
				owned_by: 'gonka',
				name: null,
				description: null,
				context_length: null,
			},
			{
				id: 'gonka/zero-context',
				object: 'model',
				name: '   ',
				context_length: 0,
			},
		],
	});

	assert.equal(nulledModel.name, undefined);
	assert.equal(nulledModel.description, undefined);
	assert.equal(buildGonkaGateModelDisplayName(nulledModel), 'gonka/nulled');
	assert.equal(buildGonkaGateModelDisplayDescription(nulledModel), undefined);

	assert.equal(buildGonkaGateModelDisplayName(zeroContextModel), 'gonka/zero-context');
	assert.equal(buildGonkaGateModelDisplayDescription(zeroContextModel), undefined);
});

test('camelCase and snake_case context window keys are both accepted', () => {
	const [snakeCaseModel, camelCaseModel] = parseGonkaGateModelCatalog({
		data: [
			{ id: 'gonka/snake', context_length: 240000 },
			{ id: 'gonka/camel', contextLength: 180000 },
		],
	});

	assert.equal(buildGonkaGateModelDisplayDescription(snakeCaseModel), 'Context 240k');
	assert.equal(buildGonkaGateModelDisplayDescription(camelCaseModel), 'Context 180k');
});

test('resolveGonkaGateModelId accepts manual strings and resource locator values', () => {
	assert.equal(resolveGonkaGateModelId(createTestNode(), ' direct-model ', 0), 'direct-model');
	assert.equal(
		resolveGonkaGateModelId(createTestNode(), createModelResourceLocator('picked-model'), 0),
		'picked-model',
	);
	assert.equal(
		resolveGonkaGateModelId(
			createTestNode(),
			createModelResourceLocator('vendor/model-with-slashes-1234'),
			0,
		),
		'vendor/model-with-slashes-1234',
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
