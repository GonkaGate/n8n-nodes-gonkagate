import assert from 'node:assert/strict';
import test from 'node:test';
import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INode,
	INodeExecutionData,
	ISupplyDataFunctions,
} from 'n8n-workflow';

import { GonkaGateApi } from '../credentials/GonkaGateApi.credentials';
import { GonkaGate } from '../nodes/GonkaGate/GonkaGate.node';
import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
import { buildGonkaGateChatModelSupplyOptions } from '../nodes/shared/GonkaGate/chatModel';

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
	assert.equal(requests[0].url, '/chat/completions');
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

test('buildGonkaGateChatModelSupplyOptions reuses the shared credential resolution seam', () => {
	const options = buildGonkaGateChatModelSupplyOptions({
		context: {
			getNode: createNode,
		},
		credentials: {
			apiKey: ' test-key ',
			url: ' https://api.gonkagate.com/v1 ',
		},
		model: ' manual-model ',
		streaming: true,
		options: {
			temperature: 0.2,
		},
		itemIndex: 0,
	});

	assert.deepEqual(options, {
		type: 'openai',
		baseUrl: 'https://api.gonkagate.com/v1',
		apiKey: 'test-key',
		defaultHeaders: {
			Accept: 'application/json',
		},
		model: 'manual-model',
		useResponsesApi: false,
		streaming: true,
		temperature: 0.2,
	});
});

test('LmChatGonkaGate.supplyData keeps the AI-node wiring local and executable', async () => {
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
});

function createNode(): INode {
	return {
		id: '1',
		name: 'Test Node',
		type: 'test.node',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	};
}

function createExecuteContext(input: {
	parameters: Array<Record<string, unknown>>;
	httpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
	continueOnFail?: boolean;
	inputData?: INodeExecutionData[];
}): IExecuteFunctions {
	const inputData = input.inputData ?? [];

	return {
		getInputData() {
			return inputData;
		},
		getNode() {
			return createNode();
		},
		getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown) {
			return input.parameters[itemIndex]?.[parameterName] ?? fallbackValue;
		},
		continueOnFail() {
			return input.continueOnFail ?? false;
		},
		helpers: {
			httpRequestWithAuthentication: input.httpRequest,
		},
	} as unknown as IExecuteFunctions;
}

function createSupplyContext(input: {
	credentials: Record<string, unknown>;
	parameters: Record<string, unknown>;
}): ISupplyDataFunctions {
	return {
		getNode() {
			return createNode();
		},
		async getCredentials() {
			return input.credentials;
		},
		getNodeParameter(parameterName: string, _itemIndex: number, fallbackValue?: unknown) {
			return input.parameters[parameterName] ?? fallbackValue;
		},
	} as unknown as ISupplyDataFunctions;
}
