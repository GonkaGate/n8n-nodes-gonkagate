import assert from 'node:assert/strict';
import test from 'node:test';

import { NodeOperationError } from 'n8n-workflow';

import { GonkaGate } from '../nodes/GonkaGate/GonkaGate.node';
import {
	GONKAGATE_CHAT_COMPLETION_OPERATION,
	GONKAGATE_LIST_MODELS_OPERATION,
} from '../nodes/GonkaGate/operationTypes';
import {
	GONKAGATE_CHAT_COMPLETIONS_PATH,
	GONKAGATE_MODELS_PATH,
} from '../shared/GonkaGate/constants';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import {
	GONKAGATE_MESSAGES_PARAMETER_NAME,
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPERATION_PARAMETER_NAME,
} from '../shared/GonkaGate/parameters';
import { createExecuteContext, type ExecuteContextOptions } from './helpers/createExecuteContext';

const CHAT_COMPLETION_MESSAGES = '[{"role":"user","content":"Hello from n8n"}]';

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
		authenticatedHttpRequest: async (credentialType, requestOptions) => {
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
		authenticatedHttpRequest: async () => {
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
		authenticatedHttpRequest: async () => {
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

test('GonkaGate.execute normalizes malformed /models payloads at the shared endpoint boundary', async () => {
	const result = await executeGonkaGateRootNode({
		itemParameters: [{ [GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_LIST_MODELS_OPERATION }],
		continueOnFail: true,
		authenticatedHttpRequest: async () => ({
			data: {
				id: 'not-an-array',
			},
		}),
	});

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

test('GonkaGate.execute routes listModels through the operation registry', async () => {
	const requests: Array<{ method?: string; url?: string }> = [];

	const result = await executeGonkaGateRootNode({
		itemParameters: [{ [GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_LIST_MODELS_OPERATION }],
		authenticatedHttpRequest: async (_credentialType, requestOptions) => {
			requests.push({
				method: requestOptions.method,
				url: requestOptions.url,
			});

			return {
				data: [{ id: 'gonka/text-fast' }],
			};
		},
	});

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
	await assert.rejects(
		executeGonkaGateRootNode({
			itemParameters: [{ [GONKAGATE_OPERATION_PARAMETER_NAME]: 'legacyOperation' }],
			authenticatedHttpRequest: async () => {
				throw new Error('httpRequest should not be called');
			},
		}),
		(error) =>
			error instanceof NodeOperationError && error.message === 'Unsupported GonkaGate operation',
	);
});

function createBoundaryFailureParameterResolver() {
	return (parameterName: string, itemIndex: number, fallbackValue?: unknown) => {
		if (parameterName === GONKAGATE_MESSAGES_PARAMETER_NAME) {
			throw createBoundaryTimeoutError('req_boundary');
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
	};
}

async function executeGonkaGateRootNode(options: ExecuteContextOptions) {
	const node = new GonkaGate();

	return await node.execute.call(createExecuteContext(options));
}

function createChatCompletionItemParameters(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		[GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_CHAT_COMPLETION_OPERATION,
		[GONKAGATE_MODEL_PARAMETER_NAME]: 'test-model',
		[GONKAGATE_MESSAGES_PARAMETER_NAME]: CHAT_COMPLETION_MESSAGES,
		...overrides,
	};
}

function createRecoverableTimeoutError(requestId: string) {
	return {
		code: 'ETIMEDOUT',
		message: 'socket timed out',
		response: {
			headers: {
				'x-request-id': requestId,
			},
			data: {
				message: 'socket timed out',
			},
		},
	};
}

function createBoundaryTimeoutError(requestId: string) {
	return {
		code: 'ETIMEDOUT',
		message: 'socket timed out',
		headers: {
			'X-Request-Id': requestId,
		},
	};
}
