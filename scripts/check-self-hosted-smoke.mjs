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

const EXPECTED_NODE_TYPE = 'gonkaGate';
const EXPECTED_AI_NODE_TYPE = 'lmChatGonkaGate';
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

async function run(command, args, options) {
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

async function createTarball() {
	const packDir = await mkdtemp(path.join(tmpdir(), 'gonkagate-pack-'));

	const { stdout } = await run('npm', ['pack', '--json', '--pack-destination', packDir], {
		cwd: repoRoot,
	});

	const result = JSON.parse(stdout);
	const filename = result[0]?.filename;

	if (typeof filename !== 'string' || filename.length === 0) {
		throw new Error('Failed to determine npm pack output filename');
	}

	return {
		packDir,
		tarballPath: path.join(packDir, filename),
	};
}

async function validateInstalledPackage(sandboxDir, packageDir) {
	const validationScript = `
const { LazyPackageDirectoryLoader } = require('n8n-core');

(async () => {
  const loader = new LazyPackageDirectoryLoader(process.argv[1], [], []);
  await loader.loadAll();

  const result = {
    packageName: loader.packageName,
    nodes: Object.keys(loader.known.nodes),
    credentials: Object.keys(loader.known.credentials),
  };

  process.stdout.write(JSON.stringify(result));
})();
`;

	const { stdout } = await run(process.execPath, ['-e', validationScript, packageDir], {
		cwd: sandboxDir,
	});

	return JSON.parse(stdout);
}

async function runVersionSmoke(n8nVersion, tarballPath, keepTemp) {
	const sandboxDir = await mkdtemp(path.join(tmpdir(), `gonkagate-smoke-${n8nVersion}-`));
	const userFolder = path.join(sandboxDir, '.n8n-user');
	const nodesDir = path.join(userFolder, 'nodes');

	try {
		await run('npm', ['init', '-y'], { cwd: sandboxDir });
		await run('npm', ['install', `n8n@${n8nVersion}`], { cwd: sandboxDir });

		await mkdir(nodesDir, { recursive: true });
		await run('npm', ['init', '-y'], { cwd: nodesDir });
		await run('npm', ['install', tarballPath], { cwd: nodesDir });

		const packageDir = path.join(nodesDir, 'node_modules', '@gonkagate', 'n8n-nodes-gonkagate');

		const loadResult = await validateInstalledPackage(sandboxDir, packageDir);
		const passed =
			loadResult.packageName === '@gonkagate/n8n-nodes-gonkagate' &&
			loadResult.nodes.includes(EXPECTED_NODE_TYPE) &&
			loadResult.nodes.includes(EXPECTED_AI_NODE_TYPE) &&
			loadResult.credentials.includes(EXPECTED_CREDENTIAL_TYPE);

		if (!passed) {
			throw new Error(
				`Unexpected loader result for n8n@${n8nVersion}: ${JSON.stringify(loadResult)}`,
			);
		}

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

async function main() {
	ensureSupportedNodeVersion();

	const { versions, keepTemp } = parseArgs(process.argv.slice(2));
	const { packDir, tarballPath } = await createTarball();

	try {
		const results = [];

		for (const version of versions) {
			results.push(await runVersionSmoke(version, tarballPath, keepTemp));
		}

		process.stdout.write(
			`${JSON.stringify(
				{
					ok: true,
					packageName: '@gonkagate/n8n-nodes-gonkagate',
					results: results.map((result) => ({
						n8nVersion: result.n8nVersion,
						nodeVersion: result.nodeVersion,
						nodes: result.loadResult.nodes,
						credentials: result.loadResult.credentials,
						...(keepTemp ? { sandboxDir: result.sandboxDir } : {}),
					})),
				},
				null,
				2,
			)}\n`,
		);
	} finally {
		await rm(packDir, { recursive: true, force: true });
	}
}

await main();
