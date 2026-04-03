import { access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import process from 'node:process';

const requiredPaths = [
	'.nvmrc',
	'AGENTS.md',
	'README.md',
	'CHANGELOG.md',
	'LICENSE',
	'docs/README.md',
	'docs/quickstart.md',
	'docs/install.md',
	'docs/compatibility.md',
	'docs/fallback-openai-paths.md',
	'docs/known-limitations.md',
	'docs/release-checklist.md',
	'docs/specs/n8n-gonkagate-node-research/spec.md',
	'docs/specs/n8n-gonkagate-prd/spec.md',
	'.github/workflows/ci.yml',
	'.github/workflows/publish.yml',
	'.github/workflows/release-please.yml',
	'package.json',
	'tsconfig.json',
	'eslint.config.mjs',
	'scripts/check-publish-context.mjs',
	'scripts/check-self-hosted-smoke.mjs',
	'credentials/GonkaGateApi.credentials.ts',
	'nodes/GonkaGate/GonkaGate.node.ts',
	'nodes/GonkaGate/GonkaGate.node.json',
	'nodes/GonkaGate/gonkagate.svg',
	'nodes/LmChatGonkaGate/LmChatGonkaGate.node.ts',
	'nodes/LmChatGonkaGate/LmChatGonkaGate.node.json',
	'nodes/LmChatGonkaGate/gonkagate.svg',
	'examples/quickstart/gonkagate-first-request.workflow.json',
];

const missing = [];

for (const path of requiredPaths) {
	try {
		await access(path, fsConstants.F_OK);
	} catch {
		missing.push(path);
	}
}

if (missing.length > 0) {
	console.error('Bootstrap check failed. Missing required repository files:');
	for (const path of missing) {
		console.error(`- ${path}`);
	}
	process.exit(1);
}

console.log('Bootstrap check passed.');
