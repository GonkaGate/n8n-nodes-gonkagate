import assert from 'node:assert/strict';
import test from 'node:test';

import { NodeOperationError } from 'n8n-workflow';

import { GonkaGateApi } from '../credentials/GonkaGateApi.credentials';
import { GonkaGate } from '../nodes/GonkaGate/GonkaGate.node';
import {
	GONKAGATE_CHAT_COMPLETION_OPERATION,
	GONKAGATE_LIST_MODELS_OPERATION,
} from '../nodes/GonkaGate/operations';
import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
import { createGonkaGateChatModelSupplier } from '../shared/GonkaGate/chatModel';
import {
	GONKAGATE_BASE_URL,
	GONKAGATE_CHAT_COMPLETIONS_PATH,
	GONKAGATE_MODELS_PATH,
} from '../shared/GonkaGate/constants';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import {
	GONKAGATE_MESSAGES_PARAMETER_NAME,
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPERATION_PARAMETER_NAME,
	GONKAGATE_OPTIONS_PARAMETER_NAME,
	GONKAGATE_STREAMING_PARAMETER_NAME,
} from '../shared/GonkaGate/parameters';
import { createExecuteContext, createSupplyContext } from './helpers/gonkagateTestUtils';

test('GonkaGate.execute composes the shared request contract at the node boundary', async () => {
	const requests: Array<{
		method?: string;
		url?: string;
		body?: unknown;
		json?: boolean;
	}> = [];
	const node = new GonkaGate();

	const result = await node.execute.call(
		createExecuteContext({
			parameters: [
				{
					[GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_CHAT_COMPLETION_OPERATION,
					[GONKAGATE_MODEL_PARAMETER_NAME]: ' test-model ',
					[GONKAGATE_MESSAGES_PARAMETER_NAME]: '[{"role":"user","content":"Hello from n8n"}]',
				},
			],
			httpRequest: async (credentialType, requestOptions) => {
				assert.equal(credentialType, GONKAGATE_CREDENTIAL_NAME);

				requests.push({
					method: requestOptions.method,
					url: requestOptions.url,
					body: requestOptions.body,
					json: requestOptions.json,
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
	assert.equal(requests[0].json, true);
	assert.deepEqual(requests[0].body, {
		model: 'test-model',
		messages: [{ role: 'user', content: 'Hello from n8n' }],
		stream: false,
	});
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
					[GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_CHAT_COMPLETION_OPERATION,
					[GONKAGATE_MODEL_PARAMETER_NAME]: 'test-model',
					[GONKAGATE_MESSAGES_PARAMETER_NAME]: '[{"role":"user","content":"Hello from n8n"}]',
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
					[GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_CHAT_COMPLETION_OPERATION,
					[GONKAGATE_MODEL_PARAMETER_NAME]: 'test-model',
				},
			],
			getNodeParameter(parameterName, itemIndex, fallbackValue) {
				if (parameterName === GONKAGATE_MESSAGES_PARAMETER_NAME) {
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

				if (parameterName === GONKAGATE_OPERATION_PARAMETER_NAME) {
					return GONKAGATE_CHAT_COMPLETION_OPERATION;
				}

				if (parameterName === GONKAGATE_MODEL_PARAMETER_NAME) {
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

test('GonkaGate.execute normalizes malformed /models payloads at the shared endpoint boundary', async () => {
	const node = new GonkaGate();

	const result = await node.execute.call(
		createExecuteContext({
			continueOnFail: true,
			parameters: [{ [GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_LIST_MODELS_OPERATION }],
			httpRequest: async () => ({
				data: {
					id: 'not-an-array',
				},
			}),
		}),
	);

	assert.deepEqual(result, [
		[
			{
				json: {
					error: 'GonkaGate models response must contain a data array',
				},
				pairedItem: undefined,
			},
		],
	]);
});

test('createGonkaGateChatModelSupplier forwards the GonkaGate AI-model contract to the SDK seam', async () => {
	let suppliedContext: unknown;
	let suppliedModel: unknown;
	let requestedCredentialName: string | undefined;
	let requestedItemIndex: number | undefined;

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
			url: GONKAGATE_BASE_URL,
		},
		async getCredentials(credentialName, itemIndex) {
			requestedCredentialName = credentialName;
			requestedItemIndex = itemIndex;

			return {
				apiKey: 'test-key',
				url: GONKAGATE_BASE_URL,
			};
		},
		parameters: {
			[GONKAGATE_MODEL_PARAMETER_NAME]: 'test-model',
			[GONKAGATE_STREAMING_PARAMETER_NAME]: false,
			[GONKAGATE_OPTIONS_PARAMETER_NAME]: {
				maxRetries: 3,
				maxTokens: 128,
				timeout: 1500,
			},
		},
	});

	const result = await supplyGonkaGateChatModel(context, 0);

	assert.equal(suppliedContext, context);
	assert.equal(requestedCredentialName, GONKAGATE_CREDENTIAL_NAME);
	assert.equal(requestedItemIndex, 0);
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

test('createGonkaGateChatModelSupplier normalizes supply-time GonkaGate failures', async () => {
	const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier(() => {
		throw {
			code: 'ETIMEDOUT',
			message: 'socket timed out',
			response: {
				headers: {
					'x-request-id': 'req_ai_model',
				},
				data: {
					message: 'socket timed out',
				},
			},
		};
	});

	await assert.rejects(
		supplyGonkaGateChatModel(
			createSupplyContext({
				credentials: {
					apiKey: 'test-key',
					url: GONKAGATE_BASE_URL,
				},
				parameters: {
					[GONKAGATE_MODEL_PARAMETER_NAME]: 'test-model',
					[GONKAGATE_STREAMING_PARAMETER_NAME]: false,
					[GONKAGATE_OPTIONS_PARAMETER_NAME]: {},
				},
			}),
			0,
		),
		(error) =>
			error instanceof NodeOperationError &&
			error.message === 'The GonkaGate request timed out' &&
			error.description === 'socket timed out\nRequest ID: req_ai_model',
	);
});

test('LmChatGonkaGate.supplyData returns an AI model response for the GonkaGate surface', async () => {
	const node = new LmChatGonkaGate();
	const result = await node.supplyData.call(
		createSupplyContext({
			credentials: {
				apiKey: 'test-key',
				url: GONKAGATE_BASE_URL,
			},
			parameters: {
				[GONKAGATE_MODEL_PARAMETER_NAME]: 'test-model',
				[GONKAGATE_STREAMING_PARAMETER_NAME]: false,
				[GONKAGATE_OPTIONS_PARAMETER_NAME]: {
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
			parameters: [{ [GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_LIST_MODELS_OPERATION }],
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

test('GonkaGate.execute rejects unsupported persisted operation values explicitly', async () => {
	const node = new GonkaGate();

	await assert.rejects(
		node.execute.call(
			createExecuteContext({
				parameters: [{ [GONKAGATE_OPERATION_PARAMETER_NAME]: 'legacyOperation' }],
				httpRequest: async () => {
					throw new Error('httpRequest should not be called');
				},
			}),
		),
		(error) =>
			error instanceof NodeOperationError && error.message === 'Unsupported GonkaGate operation',
	);
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
