import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { GonkaGateApi } from '../credentials/GonkaGateApi.credentials';
import { GonkaGate } from '../nodes/GonkaGate/GonkaGate.node';
import { getGonkaGateOperationDefinitions } from '../nodes/GonkaGate/operationDefinitions';
import {
	GONKAGATE_CHAT_COMPLETION_OPERATION,
	GONKAGATE_DEFAULT_OPERATION,
	GONKAGATE_LIST_MODELS_OPERATION,
} from '../nodes/GonkaGate/operationTypes';
import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
import { GONKAGATE_MODEL_SEARCH_METHOD_NAME } from '../shared/GonkaGate/identifiers';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import {
	GONKAGATE_CHAT_MODEL_DESCRIPTION,
	GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
	GONKAGATE_CHAT_MODEL_DOCUMENTATION_URL,
	GONKAGATE_CREDENTIAL_DISPLAY_NAME,
	GONKAGATE_CREDENTIAL_DOCUMENTATION_URL,
	GONKAGATE_NODE_DESCRIPTION,
	GONKAGATE_NODE_DISPLAY_NAME,
	GONKAGATE_ROOT_NODE_DOCUMENTATION_URL,
} from '../shared/GonkaGate/metadata';
import { GONKAGATE_RECOMMENDED_MODEL_ID } from '../shared/GonkaGate/modelParameter';

type NodeManifest = {
	resources?: {
		credentialDocumentation?: Array<{ url?: string }>;
		primaryDocumentation?: Array<{ url?: string }>;
	};
};

test('public metadata stays aligned across TS entrypoints and static node manifests', () => {
	const rootNode = new GonkaGate();
	const chatModelNode = new LmChatGonkaGate();
	const credential = new GonkaGateApi();
	const rootManifest = readNodeManifest('nodes/GonkaGate/GonkaGate.node.json');
	const chatModelManifest = readNodeManifest('nodes/LmChatGonkaGate/LmChatGonkaGate.node.json');

	assert.equal(rootNode.description.displayName, GONKAGATE_NODE_DISPLAY_NAME);
	assert.equal(rootNode.description.description, GONKAGATE_NODE_DESCRIPTION);
	assert.equal(chatModelNode.description.displayName, GONKAGATE_CHAT_MODEL_DISPLAY_NAME);
	assert.equal(chatModelNode.description.description, GONKAGATE_CHAT_MODEL_DESCRIPTION);
	assert.equal(credential.displayName, GONKAGATE_CREDENTIAL_DISPLAY_NAME);
	assert.equal(credential.documentationUrl, GONKAGATE_CREDENTIAL_DOCUMENTATION_URL);
	assert.deepEqual(rootNode.description.credentials, [
		{
			name: GONKAGATE_CREDENTIAL_NAME,
			required: true,
		},
	]);
	assert.deepEqual(chatModelNode.description.credentials, rootNode.description.credentials);

	assert.equal(
		rootManifest.resources?.credentialDocumentation?.[0]?.url,
		GONKAGATE_CREDENTIAL_DOCUMENTATION_URL,
	);
	assert.equal(
		rootManifest.resources?.primaryDocumentation?.[0]?.url,
		GONKAGATE_ROOT_NODE_DOCUMENTATION_URL,
	);
	assert.equal(
		chatModelManifest.resources?.credentialDocumentation?.[0]?.url,
		GONKAGATE_CREDENTIAL_DOCUMENTATION_URL,
	);
	assert.equal(
		chatModelManifest.resources?.primaryDocumentation?.[0]?.url,
		GONKAGATE_CHAT_MODEL_DOCUMENTATION_URL,
	);
});

test('operation selector and model discovery wiring stay aligned with registered seams', () => {
	const rootNode = new GonkaGate();
	const chatModelNode = new LmChatGonkaGate();
	const operationProperty = rootNode.description.properties.find(
		(property) => property.name === 'operation',
	);
	const modelProperty = rootNode.description.properties.find(
		(property) => property.name === 'model',
	);

	assert.ok(operationProperty);
	assert.equal(operationProperty?.default, GONKAGATE_DEFAULT_OPERATION);
	assert.deepEqual(
		operationProperty?.options?.map((option) =>
			'name' in option && 'value' in option ? option.value : undefined,
		),
		getGonkaGateOperationDefinitions().map((operation) => operation.operation),
	);
	assert.deepEqual(
		getGonkaGateOperationDefinitions().map((operation) => operation.operation),
		[GONKAGATE_CHAT_COMPLETION_OPERATION, GONKAGATE_LIST_MODELS_OPERATION],
	);

	assert.equal(
		rootNode.methods?.listSearch?.[GONKAGATE_MODEL_SEARCH_METHOD_NAME],
		chatModelNode.methods?.listSearch?.[GONKAGATE_MODEL_SEARCH_METHOD_NAME],
	);
	assert.equal(
		modelProperty?.modes?.[0]?.typeOptions?.searchListMethod,
		GONKAGATE_MODEL_SEARCH_METHOD_NAME,
	);
	assert.deepEqual(modelProperty?.default, {
		mode: 'id',
		value: GONKAGATE_RECOMMENDED_MODEL_ID,
	});
});

function readNodeManifest(relativePath: string): NodeManifest {
	return JSON.parse(
		readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'),
	) as NodeManifest;
}
