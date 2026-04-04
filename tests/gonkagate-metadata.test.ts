import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { GonkaGateApi } from '../credentials/GonkaGateApi.credentials';
import { GonkaGate } from '../nodes/GonkaGate/GonkaGate.node';
import { LmChatGonkaGate } from '../nodes/LmChatGonkaGate/LmChatGonkaGate.node';
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

function readNodeManifest(relativePath: string): NodeManifest {
	return JSON.parse(
		readFileSync(path.resolve(process.cwd(), relativePath), 'utf8'),
	) as NodeManifest;
}
