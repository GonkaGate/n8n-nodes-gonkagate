import assert from 'node:assert/strict';
import test from 'node:test';
import type { ILoadOptionsFunctions, INode } from 'n8n-workflow';

import {
	buildGonkaGateChatModelOptions,
	buildGonkaGateModelSearchResults,
	createGonkaGateChatModelOptionsProperty,
	normalizeGonkaGateError,
	parseGonkaGateModelsResponse,
	resolveGonkaGateModelId,
	resolveGonkaGateBaseUrl,
	searchGonkaGateModels,
	serializeGonkaGateError,
} from '../nodes/shared/GonkaGate';

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
		resolveGonkaGateModelId(createNode(), { __rl: true, mode: 'id', value: 'picked-model' }, 0),
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

function createNode(): INode {
	return {
		id: '1',
		name: 'Test Node',
		type: 'test.node',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	};
}

function createLoadOptionsContext(input: {
	credentialsSelected: boolean;
	httpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
}): ILoadOptionsFunctions {
	return {
		getNode() {
			return {
				...createNode(),
				credentials: input.credentialsSelected
					? {
							gonkaGateApi: {
								id: '1',
								name: 'Test GonkaGate Credential',
							},
						}
					: undefined,
			};
		},
		helpers: {
			httpRequestWithAuthentication: input.httpRequest,
		},
	} as unknown as ILoadOptionsFunctions;
}
