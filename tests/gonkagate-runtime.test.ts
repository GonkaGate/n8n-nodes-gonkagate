import assert from 'node:assert/strict';
import test from 'node:test';

import { GonkaGateApi } from '../credentials/GonkaGateApi.credentials';
import { GonkaGate } from '../nodes/GonkaGate/GonkaGate.node';
import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
import { createGonkaGateChatModelSupplier } from '../shared/GonkaGate/chatModel';
import {
	GONKAGATE_BASE_URL,
	GONKAGATE_CHAT_COMPLETIONS_PATH,
	GONKAGATE_MODELS_PATH,
} from '../shared/GonkaGate/constants';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import { createExecuteContext, createSupplyContext } from './helpers/gonkagateTestUtils';

test('GonkaGate.execute composes shared request building with credential auth', async () => {
	const requests: Array<{
		baseURL?: string;
		method?: string;
		url?: string;
		body?: unknown;
		headers?: unknown;
	}> = [];
	const node = new GonkaGate();
	const credential = new GonkaGateApi();
	const credentials = {
		apiKey: ' test-key ',
		url: ' https://api.gonkagate.com/v1 ',
	};

	const result = await node.execute.call(
		createExecuteContext({
			parameters: [
				{
					operation: 'chatCompletion',
					model: ' test-model ',
					messages: '[{"role":"user","content":"Hello from n8n"}]',
				},
			],
			httpRequest: async (credentialType, requestOptions) => {
				assert.equal(credentialType, GONKAGATE_CREDENTIAL_NAME);

				const authenticatedRequest = await credential.authenticate(credentials, requestOptions);

				requests.push({
					baseURL: authenticatedRequest.baseURL,
					method: authenticatedRequest.method,
					url: authenticatedRequest.url,
					body: authenticatedRequest.body,
					headers: authenticatedRequest.headers,
				});

				return {
					id: 'chatcmpl_123',
					object: 'chat.completion',
				};
			},
		}),
	);

	assert.equal(requests.length, 1);
	assert.equal(requests[0].baseURL, GONKAGATE_BASE_URL);
	assert.equal(requests[0].method, 'POST');
	assert.equal(requests[0].url, GONKAGATE_CHAT_COMPLETIONS_PATH);
	assert.deepEqual(requests[0].body, {
		model: 'test-model',
		messages: [{ role: 'user', content: 'Hello from n8n' }],
		stream: false,
	});
	assert.match(
		String((requests[0].headers as Record<string, unknown>).Accept),
		/application\/json/,
	);
	assert.equal((requests[0].headers as Record<string, unknown>).Authorization, 'Bearer test-key');
	assert.deepEqual(result, [
		[
			{
				json: { id: 'chatcmpl_123', object: 'chat.completion' },
				pairedItem: undefined,
			},
		],
	]);
});

test('GonkaGate.execute serializes recoverable upstream failures when continueOnFail is enabled', async () => {
	const node = new GonkaGate();

	const result = await node.execute.call(
		createExecuteContext({
			inputData: [{ json: { source: 'input' } }],
			continueOnFail: true,
			parameters: [
				{
					operation: 'chatCompletion',
					model: 'test-model',
					messages: '[{"role":"user","content":"Hello from n8n"}]',
				},
			],
			httpRequest: async () => {
				throw {
					code: 'ETIMEDOUT',
					message: 'socket timed out',
					response: {
						headers: {
							'x-request-id': 'req_timeout',
						},
						data: {
							message: 'socket timed out',
						},
					},
				};
			},
		}),
	);

	assert.deepEqual(result, [
		[
			{
				json: {
					error: 'The GonkaGate request timed out',
					description: 'socket timed out\nRequest ID: req_timeout',
					requestId: 'req_timeout',
				},
				pairedItem: { item: 0 },
			},
		],
	]);
});

test('GonkaGate.execute normalizes raw pre-request failures at the node boundary', async () => {
	const node = new GonkaGate();

	const result = await node.execute.call(
		createExecuteContext({
			inputData: [{ json: { source: 'input' } }],
			continueOnFail: true,
			parameters: [
				{
					operation: 'chatCompletion',
					model: 'test-model',
				},
			],
			getNodeParameter(parameterName, itemIndex, fallbackValue) {
				if (parameterName === 'messages') {
					throw {
						code: 'ETIMEDOUT',
						message: 'socket timed out',
						headers: {
							'X-Request-Id': 'req_boundary',
						},
					};
				}

				if (itemIndex !== 0) {
					return fallbackValue;
				}

				if (parameterName === 'operation') {
					return 'chatCompletion';
				}

				if (parameterName === 'model') {
					return 'test-model';
				}

				return fallbackValue;
			},
			httpRequest: async () => {
				throw new Error('httpRequest should not be called');
			},
		}),
	);

	assert.deepEqual(result, [
		[
			{
				json: {
					error: 'The GonkaGate request timed out',
					description: 'socket timed out\nRequest ID: req_boundary',
					requestId: 'req_boundary',
				},
				pairedItem: { item: 0 },
			},
		],
	]);
});

test('GonkaGateApi.authenticate applies the shared credential authentication policy', async () => {
	const credential = new GonkaGateApi();
	const requestOptions = await credential.authenticate(
		{
			apiKey: ' test-key ',
			url: ' https://api.gonkagate.com/v1 ',
		},
		{
			url: '/models',
			headers: {
				'X-Test': '1',
			},
		},
	);

	assert.equal(requestOptions.baseURL, 'https://api.gonkagate.com/v1');
	assert.deepEqual(requestOptions.headers, {
		Accept: 'application/json',
		Authorization: 'Bearer test-key',
		'X-Test': '1',
	});
});

test('createGonkaGateChatModelSupplier forwards the GonkaGate AI-model contract to the SDK seam', async () => {
	let suppliedContext: unknown;
	let suppliedModel: unknown;

	const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier((context, model) => {
		suppliedContext = context;
		suppliedModel = model;

		return {
			response: { ok: true },
		};
	});

	const context = createSupplyContext({
		credentials: {
			apiKey: 'test-key',
			url: 'https://api.gonkagate.com/v1',
		},
		parameters: {
			model: 'test-model',
			streaming: false,
			options: {
				maxRetries: 3,
				maxTokens: 128,
				timeout: 1500,
			},
		},
	});

	const result = await supplyGonkaGateChatModel(context, 0);

	assert.equal(suppliedContext, context);
	assert.deepEqual(suppliedModel, {
		type: 'openai',
		baseUrl: GONKAGATE_BASE_URL,
		apiKey: 'test-key',
		defaultHeaders: {
			Accept: 'application/json',
		},
		model: 'test-model',
		useResponsesApi: false,
		streaming: false,
		maxRetries: 3,
		maxTokens: 128,
		timeout: 1500,
	});
	assert.deepEqual(result, {
		response: { ok: true },
	});
});

test('LmChatGonkaGate.supplyData returns an AI model response for the GonkaGate surface', async () => {
	const node = new LmChatGonkaGate();
	const result = await node.supplyData.call(
		createSupplyContext({
			credentials: {
				apiKey: 'test-key',
				url: 'https://api.gonkagate.com/v1',
			},
			parameters: {
				model: 'test-model',
				streaming: false,
				options: {
					maxTokens: 128,
				},
			},
		}),
		0,
	);

	assert.ok(result.response);
});

test('GonkaGate.execute routes listModels through the operation registry', async () => {
	const requests: Array<{ method?: string; url?: string }> = [];
	const node = new GonkaGate();

	const result = await node.execute.call(
		createExecuteContext({
			parameters: [{ operation: 'listModels' }],
			httpRequest: async (_credentialType, requestOptions) => {
				requests.push({
					method: requestOptions.method,
					url: requestOptions.url,
				});

				return {
					data: [{ id: 'gonka/text-fast' }],
				};
			},
		}),
	);

	assert.deepEqual(requests, [{ method: 'GET', url: GONKAGATE_MODELS_PATH }]);
	assert.deepEqual(result, [
		[
			{
				json: {
					data: [{ id: 'gonka/text-fast' }],
				},
				pairedItem: undefined,
			},
		],
	]);
});

test('GonkaGateApi test request reuses the normalized runtime transport defaults', () => {
	const credential = new GonkaGateApi();

	assert.equal(credential.test.request.baseURL, undefined);
	assert.equal(credential.test.request.method, 'GET');
	assert.equal(credential.test.request.url, GONKAGATE_MODELS_PATH);
	assert.equal(credential.test.request.json, true);
	assert.deepEqual(credential.test.request.headers, {
		Accept: 'application/json',
	});
});
