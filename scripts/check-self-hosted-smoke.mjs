import { execFile as execFileCallback } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const validateInstalledPackageScriptPath = path.resolve(
	repoRoot,
	'scripts',
	'validate-installed-package.cjs',
);

const EXPECTED_NODE_TYPE = 'gonkaGate';
const EXPECTED_CHAT_MODEL_NODE_TYPE = 'lmChatGonkaGate';
const EXPECTED_CREDENTIAL_TYPE = 'gonkaGateApi';
const DEFAULT_VERSIONS = ['2.13.4', '2.14.2'];

function parseArgs(argv) {
	const versions = [];
	let keepTemp = false;

	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index];

		if (argument === '--n8n-version') {
			const value = argv[index + 1];

			if (value === undefined) {
				throw new Error('Missing value for --n8n-version');
			}

			versions.push(value);
			index += 1;
			continue;
		}

		if (argument === '--keep-temp') {
			keepTemp = true;
			continue;
		}

		throw new Error(`Unknown argument: ${argument}`);
	}

	return {
		versions: versions.length > 0 ? versions : DEFAULT_VERSIONS,
		keepTemp,
	};
}

function ensureSupportedNodeVersion() {
	const [major, minor] = process.versions.node.split('.').map((value) => Number(value));

	if (major < 22 || major >= 25 || (major === 22 && minor < 16)) {
		throw new Error(
			`Self-hosted smoke checks must run on Node >=22.16 and <25. Current runtime: ${process.version}`,
		);
	}
}

async function runCommand(command, args, options) {
	try {
		return await execFile(command, args, {
			...options,
			maxBuffer: 1024 * 1024 * 50,
			env: {
				...process.env,
				...options?.env,
			},
		});
	} catch (error) {
		const stdout =
			typeof error.stdout === 'string' && error.stdout.length > 0
				? `\nSTDOUT:\n${error.stdout}`
				: '';
		const stderr =
			typeof error.stderr === 'string' && error.stderr.length > 0
				? `\nSTDERR:\n${error.stderr}`
				: '';

		throw new Error(`Command failed: ${command} ${args.join(' ')}${stdout}${stderr}`, {
			cause: error,
		});
	}
}

async function createPackageTarball() {
	const packDir = await mkdtemp(path.join(tmpdir(), 'gonkagate-pack-'));

	const { stdout } = await runCommand('npm', ['pack', '--json', '--pack-destination', packDir], {
		cwd: repoRoot,
	});

	const filename = parsePackOutput(stdout);

	return {
		packDir,
		tarballPath: path.join(packDir, filename),
	};
}

async function validateInstalledPackage(sandboxDir, packageDir) {
	const { stdout } = await runCommand(
		process.execPath,
		[validateInstalledPackageScriptPath, packageDir],
		{
			cwd: sandboxDir,
		},
	);

	return JSON.parse(stdout);
}

async function runSmokeForVersion(n8nVersion, tarballPath, keepTemp) {
	const sandboxDir = await mkdtemp(path.join(tmpdir(), `gonkagate-smoke-${n8nVersion}-`));
	const { nodesDir } = createSandboxPaths(sandboxDir);

	try {
		await installN8nVersion(sandboxDir, n8nVersion);
		await installPackedNode(nodesDir, tarballPath);

		const packageDir = resolveInstalledPackageDirectory(nodesDir);

		const loadResult = await validateInstalledPackage(sandboxDir, packageDir);
		assertInstalledPackageMatchesExpectation(n8nVersion, loadResult);

		return {
			n8nVersion,
			nodeVersion: process.version,
			sandboxDir,
			loadResult,
		};
	} finally {
		if (!keepTemp) {
			await rm(sandboxDir, { recursive: true, force: true });
		}
	}
}

function createSandboxPaths(sandboxDir) {
	const userFolder = path.join(sandboxDir, '.n8n-user');

	return {
		userFolder,
		nodesDir: path.join(userFolder, 'nodes'),
	};
}

function parsePackOutput(stdout) {
	const result = JSON.parse(stdout);
	const filename = result[0]?.filename;

	if (typeof filename !== 'string' || filename.length === 0) {
		throw new Error('Failed to determine npm pack output filename');
	}

	return filename;
}

async function installN8nVersion(sandboxDir, n8nVersion) {
	await runCommand('npm', ['init', '-y'], { cwd: sandboxDir });
	await runCommand('npm', ['install', `n8n@${n8nVersion}`], { cwd: sandboxDir });
}

async function installPackedNode(nodesDir, tarballPath) {
	await mkdir(nodesDir, { recursive: true });
	await runCommand('npm', ['init', '-y'], { cwd: nodesDir });
	await runCommand('npm', ['install', tarballPath], { cwd: nodesDir });
}

function resolveInstalledPackageDirectory(nodesDir) {
	return path.join(nodesDir, 'node_modules', '@gonkagate', 'n8n-nodes-gonkagate');
}

function assertInstalledPackageMatchesExpectation(n8nVersion, loadResult) {
	const passed =
		loadResult.packageName === '@gonkagate/n8n-nodes-gonkagate' &&
		loadResult.nodes.includes(EXPECTED_NODE_TYPE) &&
		loadResult.nodes.includes(EXPECTED_CHAT_MODEL_NODE_TYPE) &&
		loadResult.credentials.includes(EXPECTED_CREDENTIAL_TYPE);

	if (!passed) {
		throw new Error(
			`Unexpected loader result for n8n@${n8nVersion}: ${JSON.stringify(loadResult)}`,
		);
	}
}

async function main() {
	ensureSupportedNodeVersion();

	const { versions, keepTemp } = parseArgs(process.argv.slice(2));
	const { packDir, tarballPath } = await createPackageTarball();

	try {
		const results = await runSmokeForVersions(versions, tarballPath, keepTemp);

		process.stdout.write(`${JSON.stringify(buildSmokeReport(results, keepTemp), null, 2)}\n`);
	} finally {
		await rm(packDir, { recursive: true, force: true });
	}
}

async function runSmokeForVersions(versions, tarballPath, keepTemp) {
	const results = [];

	for (const version of versions) {
		results.push(await runSmokeForVersion(version, tarballPath, keepTemp));
	}

	return results;
}

function buildSmokeReport(results, keepTemp) {
	return {
		ok: true,
		packageName: '@gonkagate/n8n-nodes-gonkagate',
		results: results.map((result) => ({
			n8nVersion: result.n8nVersion,
			nodeVersion: result.nodeVersion,
			nodes: result.loadResult.nodes,
			credentials: result.loadResult.credentials,
			...(keepTemp ? { sandboxDir: result.sandboxDir } : {}),
		})),
	};
}

await main();
