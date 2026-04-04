import assert from 'node:assert/strict';
import test from 'node:test';

import { GonkaGateApi } from '../credentials/GonkaGateApi.credentials';
import { GonkaGate } from '../nodes/GonkaGate/GonkaGate.node';
import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
import {
	GONKAGATE_BASE_URL,
	GONKAGATE_CHAT_COMPLETIONS_PATH,
	GONKAGATE_MODELS_PATH,
} from '../shared/GonkaGate/constants';
import {
	createExecuteContext,
	createSupplyContext,
} from './helpers/gonkagateTestUtils';

test('GonkaGate.execute routes chat completion requests through the shared operation seam', async () => {
	const requests: Array<{ method?: string; url?: string; body?: unknown; headers?: unknown }> = [];
	const node = new GonkaGate();

	const result = await node.execute.call(
		createExecuteContext({
			parameters: [
				{
					operation: 'chatCompletion',
					model: ' test-model ',
					messages: '[{"role":"user","content":"Hello from n8n"}]',
				},
			],
			httpRequest: async (_credentialType, requestOptions) => {
				requests.push({
					method: requestOptions.method,
					url: requestOptions.url,
					body: requestOptions.body,
					headers: requestOptions.headers,
				});

				return {
					id: 'chatcmpl_123',
					object: 'chat.completion',
				};
			},
		}),
	);

	assert.equal(requests.length, 1);
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

test('LmChatGonkaGate.supplyData preserves the GonkaGate chat-model contract', async () => {
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
	const response = result.response as {
		fields?: {
			model?: unknown;
			apiKey?: unknown;
			useResponsesApi?: unknown;
			streaming?: unknown;
			maxTokens?: unknown;
			configuration?: {
				baseURL?: unknown;
				defaultHeaders?: unknown;
			};
		};
	};
	assert.equal(response.fields?.model, 'test-model');
	assert.equal(response.fields?.apiKey, 'test-key');
	assert.equal(response.fields?.useResponsesApi, false);
	assert.equal(response.fields?.streaming, false);
	assert.equal(response.fields?.maxTokens, 128);
	assert.equal(response.fields?.configuration?.baseURL, GONKAGATE_BASE_URL);
	assert.deepEqual(response.fields?.configuration?.defaultHeaders, {
		Accept: 'application/json',
	});
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
