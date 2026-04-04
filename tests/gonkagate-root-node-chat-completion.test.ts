import assert from 'node:assert/strict';
import test from 'node:test';

import {
	createBoundaryFailureParameterResolver,
	createChatCompletionItemParameters,
	createRecoverableTimeoutError,
	executeGonkaGateRootNode,
} from './helpers/createGonkaGateRootNodeTestData';
import { GONKAGATE_CHAT_COMPLETIONS_PATH } from '../shared/GonkaGate/constants';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import { GONKAGATE_MODEL_PARAMETER_NAME } from '../shared/GonkaGate/parameters';

test('GonkaGate.execute composes the shared request contract at the node boundary', async () => {
	const requests: Array<{
		method?: string;
		url?: string;
		body?: unknown;
		json?: boolean;
	}> = [];

	const result = await executeGonkaGateRootNode({
		itemParameters: [
			createChatCompletionItemParameters({
				[GONKAGATE_MODEL_PARAMETER_NAME]: ' test-model ',
			}),
		],
		httpRequestWithAuthentication: async (credentialType, requestOptions) => {
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
	});

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
	const result = await executeGonkaGateRootNode({
		inputItems: [{ json: { source: 'input' } }],
		continueOnFail: true,
		itemParameters: [createChatCompletionItemParameters()],
		httpRequestWithAuthentication: async () => {
			throw createRecoverableTimeoutError('req_timeout');
		},
	});

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
	const result = await executeGonkaGateRootNode({
		inputItems: [{ json: { source: 'input' } }],
		continueOnFail: true,
		itemParameters: [createChatCompletionItemParameters()],
		getNodeParameter: createBoundaryFailureParameterResolver(),
		httpRequestWithAuthentication: async () => {
			throw new Error('httpRequest should not be called');
		},
	});

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
