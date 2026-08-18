import assert from 'node:assert/strict';
import test from 'node:test';

import { NodeOperationError } from 'n8n-workflow';

import { createGonkaGateChatModelSupplier } from '../shared/GonkaGate/chatModel';
import { GONKAGATE_BASE_URL, GONKAGATE_MODELS_PATH } from '../shared/GonkaGate/constants';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import {
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_STREAMING_PARAMETER_NAME,
} from '../shared/GonkaGate/parameters';
import { createChatModelNodeParameters } from './helpers/createGonkaGateChatModelParameters';
import { createRecoverableTimeoutError } from './helpers/createGonkaGateErrorFixtures';
import { createSupplyDataContext } from './helpers/createSupplyDataContext';

test('createGonkaGateChatModelSupplier forwards the GonkaGate chat-model contract to the SDK seam', async () => {
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

	const context = createSupplyDataContext({
		credentials: {
			apiKey: 'test-key',
			baseUrl: GONKAGATE_BASE_URL,
		},
		credentialItemIndex: 0,
		parameterItemIndex: 0,
		getCredentials(credentialName, itemIndex) {
			requestedCredentialName = credentialName;
			requestedItemIndex = itemIndex;

			return {
				apiKey: 'test-key',
				baseUrl: GONKAGATE_BASE_URL,
			};
		},
		parameters: createChatModelNodeParameters({
			options: {
				maxRetries: 3,
				maxTokens: 128,
				timeout: 1500,
			},
		}),
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

test('createGonkaGateChatModelSupplier supplies the first live catalog model when Model is empty', async () => {
	let suppliedModel: unknown;
	const requestedUrls: unknown[] = [];
	const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier((_context, model) => {
		suppliedModel = model;

		return { response: { ok: true } };
	});

	await supplyGonkaGateChatModel(
		createSupplyDataContext({
			credentials: {
				apiKey: 'test-key',
				baseUrl: GONKAGATE_BASE_URL,
			},
			parameters: {
				...createChatModelNodeParameters(),
				[GONKAGATE_MODEL_PARAMETER_NAME]: { __rl: true, mode: 'list', value: '' },
			},
			async httpRequestWithAuthentication(_credentialType, requestOptions) {
				requestedUrls.push(requestOptions.url);

				return {
					object: 'list',
					data: [
						{ id: 'gonka/first-listed', object: 'model', created: 0, owned_by: 'gonka' },
						{ id: 'gonka/second-listed', object: 'model', created: 0, owned_by: 'gonka' },
					],
				};
			},
		}),
		0,
	);

	assert.deepEqual(requestedUrls, [GONKAGATE_MODELS_PATH]);
	assert.equal((suppliedModel as { model?: string }).model, 'gonka/first-listed');
});

test('createGonkaGateChatModelSupplier normalizes supply-time GonkaGate failures', async () => {
	const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier(() => {
		throw createRecoverableTimeoutError('req_chat_model');
	});

	await assert.rejects(
		supplyGonkaGateChatModel(
			createSupplyDataContext({
				credentials: {
					apiKey: 'test-key',
					baseUrl: GONKAGATE_BASE_URL,
				},
				credentialItemIndex: 0,
				parameterItemIndex: 0,
				parameters: createChatModelNodeParameters(),
			}),
			0,
		),
		(error) =>
			error instanceof NodeOperationError &&
			error.message === 'The GonkaGate request timed out' &&
			error.description === 'socket timed out\nRequest ID: req_chat_model',
	);
});

test('createGonkaGateChatModelSupplier rejects corrupted non-boolean streaming values', async () => {
	let supplierCalled = false;
	const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier(() => {
		supplierCalled = true;

		return {
			response: { ok: true },
		};
	});

	await assert.rejects(
		supplyGonkaGateChatModel(
			createSupplyDataContext({
				credentials: {
					apiKey: 'test-key',
					baseUrl: GONKAGATE_BASE_URL,
				},
				credentialItemIndex: 0,
				parameterItemIndex: 0,
				parameters: {
					...createChatModelNodeParameters(),
					[GONKAGATE_STREAMING_PARAMETER_NAME]: 'false',
				},
			}),
			0,
		),
		(error) =>
			error instanceof NodeOperationError && error.message === 'Enable Streaming must be a boolean',
	);

	assert.equal(supplierCalled, false);
});
