import assert from 'node:assert/strict';
import test from 'node:test';

import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
import { GONKAGATE_BASE_URL } from '../shared/GonkaGate/constants';
import { createChatModelNodeParameters } from './helpers/createGonkaGateChatModelParameters';
import { createSupplyDataContext } from './helpers/createSupplyDataContext';

test('LmChatGonkaGate.supplyData returns a chat-model response for the GonkaGate surface', async () => {
	const node = new LmChatGonkaGate();
	const result = await node.supplyData.call(
		createSupplyDataContext({
			credentials: {
				apiKey: 'test-key',
				baseUrl: GONKAGATE_BASE_URL,
			},
			credentialItemIndex: 0,
			parameterItemIndex: 0,
			parameters: createChatModelNodeParameters({
				options: {
					maxTokens: 128,
				},
			}),
		}),
		0,
	);

	assert.ok(result.response);
});
