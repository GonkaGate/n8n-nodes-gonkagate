import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGonkaGateChatCompletionRequestBody } from '../shared/GonkaGate/chatCompletionParameters';
import { createTestNode } from './helpers/createTestNode';

test('buildGonkaGateChatCompletionRequestBody normalizes chat payloads', () => {
	const requestBody = buildGonkaGateChatCompletionRequestBody({
		node: createTestNode(),
		rawModel: ' manual-model ',
		rawMessages: '[{"role":"user","content":"Hello from n8n"}]',
		rawStreaming: false,
		rawOptions: {
			maxRetries: 4,
			maxTokens: 256,
			temperature: 0.3,
			timeout: 1500,
		},
		itemIndex: 0,
	});

	assert.deepEqual(requestBody, {
		model: 'manual-model',
		messages: [{ role: 'user', content: 'Hello from n8n' }],
		stream: false,
		maxTokens: 256,
		temperature: 0.3,
	});
});

test('buildGonkaGateChatCompletionRequestBody rejects malformed option collections', () => {
	assert.throws(
		() =>
			buildGonkaGateChatCompletionRequestBody({
				node: createTestNode(),
				rawModel: 'manual-model',
				rawMessages: [{ role: 'user', content: 'Hello from n8n' }],
				rawStreaming: false,
				rawOptions: 'not-an-options-object',
				itemIndex: 0,
			}),
		/Options must be an object/,
	);
});
