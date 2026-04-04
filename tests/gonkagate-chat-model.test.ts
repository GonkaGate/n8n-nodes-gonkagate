import assert from 'node:assert/strict';
import test from 'node:test';

import { NodeOperationError } from 'n8n-workflow';

import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
import { createGonkaGateChatModelSupplier } from '../shared/GonkaGate/chatModel';
import { GONKAGATE_BASE_URL } from '../shared/GonkaGate/constants';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import {
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPTIONS_PARAMETER_NAME,
	GONKAGATE_STREAMING_PARAMETER_NAME,
} from '../shared/GonkaGate/parameters';
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
		credentialData: {
			apiKey: 'test-key',
			baseUrl: GONKAGATE_BASE_URL,
		},
		getCredentials(credentialName, itemIndex) {
			requestedCredentialName = credentialName;
			requestedItemIndex = itemIndex;

			return {
				apiKey: 'test-key',
				baseUrl: GONKAGATE_BASE_URL,
			};
		},
		nodeParameters: createChatModelNodeParameters({
			[GONKAGATE_OPTIONS_PARAMETER_NAME]: {
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

test('createGonkaGateChatModelSupplier normalizes supply-time GonkaGate failures', async () => {
	const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier(() => {
		throw {
			code: 'ETIMEDOUT',
			message: 'socket timed out',
			response: {
				headers: {
					'x-request-id': 'req_chat_model',
				},
				data: {
					message: 'socket timed out',
				},
			},
		};
	});

	await assert.rejects(
		supplyGonkaGateChatModel(
			createSupplyDataContext({
				credentialData: {
					apiKey: 'test-key',
					baseUrl: GONKAGATE_BASE_URL,
				},
				nodeParameters: createChatModelNodeParameters(),
			}),
			0,
		),
		(error) =>
			error instanceof NodeOperationError &&
			error.message === 'The GonkaGate request timed out' &&
			error.description === 'socket timed out\nRequest ID: req_chat_model',
	);
});

test('LmChatGonkaGate.supplyData returns a chat-model response for the GonkaGate surface', async () => {
	const node = new LmChatGonkaGate();
	const result = await node.supplyData.call(
		createSupplyDataContext({
			credentialData: {
				apiKey: 'test-key',
				baseUrl: GONKAGATE_BASE_URL,
			},
			nodeParameters: createChatModelNodeParameters({
				[GONKAGATE_OPTIONS_PARAMETER_NAME]: {
					maxTokens: 128,
				},
			}),
		}),
		0,
	);

	assert.ok(result.response);
});

function createChatModelNodeParameters(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		[GONKAGATE_MODEL_PARAMETER_NAME]: 'test-model',
		[GONKAGATE_STREAMING_PARAMETER_NAME]: false,
		[GONKAGATE_OPTIONS_PARAMETER_NAME]: {},
		...overrides,
	};
}
