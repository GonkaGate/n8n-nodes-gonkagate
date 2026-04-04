import assert from 'node:assert/strict';
import test from 'node:test';

import {
	isRecoverableGonkaGateError,
	normalizeGonkaGateError,
	serializeGonkaGateError,
} from '../shared/GonkaGate/errors';
import { GONKAGATE_CHAT_COMPLETION_OPERATION_NAME } from '../shared/GonkaGate/operationNames';
import { createTestNode } from './helpers/createTestNode';

test('serializeGonkaGateError keeps normalized request metadata for continueOnFail output', () => {
	const error = normalizeGonkaGateError(
		createTestNode(),
		{
			code: 'ETIMEDOUT',
			message: 'socket timed out',
			response: {
				headers: {
					'X-Request-Id': 'req_123',
				},
				data: {
					message: 'socket timed out',
				},
			},
		},
		2,
		GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
	);

	assert.deepEqual(serializeGonkaGateError(error), {
		error: 'The GonkaGate request timed out',
		description: 'socket timed out\nRequest ID: req_123',
		requestId: 'req_123',
	});
});

test('normalizeGonkaGateError preserves the recoverable upstream error contract', () => {
	const error = normalizeGonkaGateError(
		createTestNode(),
		{
			code: 'ETIMEDOUT',
			message: 'socket timed out',
			response: {
				headers: {
					'x-request-id': 'req_456',
				},
				data: {
					message: 'socket timed out',
				},
			},
		},
		0,
		GONKAGATE_CHAT_COMPLETION_OPERATION_NAME,
	);

	assert.equal(isRecoverableGonkaGateError(error), true);
	assert.deepEqual(serializeGonkaGateError(error), {
		error: 'The GonkaGate request timed out',
		description: 'socket timed out\nRequest ID: req_456',
		requestId: 'req_456',
	});
});
