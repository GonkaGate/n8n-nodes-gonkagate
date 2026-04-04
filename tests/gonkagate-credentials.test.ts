import assert from 'node:assert/strict';
import test from 'node:test';

import { GonkaGateApi } from '../credentials/GonkaGateApi.credentials';
import { GONKAGATE_MODELS_PATH } from '../shared/GonkaGate/constants';
import { resolveGonkaGateBaseUrl } from '../shared/GonkaGate/credentials';

test('resolveGonkaGateBaseUrl rejects the legacy placeholder', () => {
	assert.throws(() => resolveGonkaGateBaseUrl('__GONKAGATE_BASE_URL_UNRESOLVED__'));
	assert.equal(
		resolveGonkaGateBaseUrl(' https://api.gonkagate.com/v1 '),
		'https://api.gonkagate.com/v1',
	);
});

test('GonkaGateApi.authenticate applies the shared credential authentication policy', async () => {
	const credential = new GonkaGateApi();
	const requestOptions = await credential.authenticate(
		{
			apiKey: ' test-key ',
			baseUrl: ' https://api.gonkagate.com/v1 ',
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
