import assert from 'node:assert/strict';
import test from 'node:test';

import { NodeOperationError } from 'n8n-workflow';

import {
	createListModelsItemParameters,
	executeGonkaGateRootNode,
} from './helpers/createGonkaGateRootNodeTestData';
import { GONKAGATE_MODELS_PATH } from '../shared/GonkaGate/constants';
import { GONKAGATE_OPERATION_PARAMETER_NAME } from '../shared/GonkaGate/parameters';

test('GonkaGate.execute normalizes malformed /models payloads at the shared endpoint boundary', async () => {
	const result = await executeGonkaGateRootNode({
		itemParameters: [createListModelsItemParameters()],
		continueOnFail: true,
		httpRequestWithAuthentication: async () => ({
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
		itemParameters: [createListModelsItemParameters()],
		httpRequestWithAuthentication: async (_credentialType, requestOptions) => {
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
			httpRequestWithAuthentication: async () => {
				throw new Error('httpRequest should not be called');
			},
		}),
		(error) =>
			error instanceof NodeOperationError && error.message === 'Unsupported GonkaGate operation',
	);
});
