const test = require('node:test');
const assert = require('node:assert/strict');

const {
	buildGonkaGateModelSearchResults,
	parseGonkaGateModelsResponse,
	resolveGonkaGateModelId,
} = require('../dist/nodes/GonkaGate/utils/models.js');
const { resolveGonkaGateBaseUrl } = require('../dist/nodes/GonkaGate/utils/credentials.js');

test('parseGonkaGateModelsResponse sorts active models before deprecated ones', () => {
	const models = parseGonkaGateModelsResponse({
		data: [
			{ id: 'legacy-model', deprecated: true, created: 10 },
			{ id: 'new-model', created: 30 },
			{ id: 'older-active-model', created: 20 },
			{ id: 'missing-id' },
			{ created: 40 },
		],
	});

	assert.deepEqual(
		models.map((model) => model.id),
		['new-model', 'older-active-model', 'missing-id', 'legacy-model'],
	);
});

test('buildGonkaGateModelSearchResults keeps rich labels and filters by metadata', () => {
	const results = buildGonkaGateModelSearchResults(
		parseGonkaGateModelsResponse({
			data: [
				{
					id: 'gonka/text-fast',
					name: 'Fast Text',
					description: 'General purpose text model',
					context_length: 128000,
					pricing: {
						prompt: '$0.10',
						completion: '$0.20',
					},
				},
				{
					id: 'gonka/reasoning-pro',
					description: 'Reasoning-focused model',
					provider: 'GonkaGate',
				},
			],
		}),
		'reasoning',
	);

	assert.equal(results.length, 1);
	assert.equal(results[0].name, 'gonka/reasoning-pro');
	assert.match(results[0].description, /Reasoning-focused model/);
});

test('resolveGonkaGateModelId accepts manual strings and resource locator values', () => {
	assert.equal(resolveGonkaGateModelId(createNode(), ' direct-model ', 0), 'direct-model');
	assert.equal(
		resolveGonkaGateModelId(createNode(), { __rl: true, mode: 'id', value: 'picked-model' }, 0),
		'picked-model',
	);
});

test('resolveGonkaGateBaseUrl rejects the legacy placeholder', () => {
	assert.throws(() => resolveGonkaGateBaseUrl('__GONKAGATE_BASE_URL_UNRESOLVED__'));
	assert.equal(
		resolveGonkaGateBaseUrl(' https://api.gonkagate.com/v1 '),
		'https://api.gonkagate.com/v1',
	);
});

function createNode() {
	return {
		id: '1',
		name: 'Test Node',
		type: 'test.node',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	};
}
