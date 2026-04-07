import { execFile as execFileCallback } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const EXPECTED_NODE_DISPLAY_NAMES = ['GonkaGate', 'GonkaGate Chat Model'];
const STARTUP_TIMEOUT_MS = 60_000;

function parseArgs(argv) {
	let image;
	let keepArtifacts = false;

	for (let index = 0; index < argv.length; index++) {
		const argument = argv[index];

		if (argument === '--image') {
			const value = argv[index + 1];

			if (value === undefined) {
				throw new Error('Missing value for --image');
			}

			image = value;
			index += 1;
			continue;
		}

		if (argument === '--keep-artifacts') {
			keepArtifacts = true;
			continue;
		}

		throw new Error(`Unknown argument: ${argument}`);
	}

	if (typeof image !== 'string' || image.length === 0) {
		throw new Error('Missing required --image argument');
	}

	return { image, keepArtifacts };
}

async function runCommand(command, args, options = {}) {
	try {
		return await execFile(command, args, {
			...options,
			maxBuffer: 1024 * 1024 * 20,
			env: {
				...process.env,
				...options.env,
			},
		});
	} catch (error) {
		throw formatCommandFailure(command, args, error);
	}
}

function formatCommandFailure(command, args, error) {
	const stdout =
		typeof error.stdout === 'string' && error.stdout.length > 0 ? `\nSTDOUT:\n${error.stdout}` : '';
	const stderr =
		typeof error.stderr === 'string' && error.stderr.length > 0 ? `\nSTDERR:\n${error.stderr}` : '';

	return new Error(`Command failed: ${command} ${args.join(' ')}${stdout}${stderr}`, {
		cause: error,
	});
}

function sleep(durationMs) {
	return new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function readContainerLogs(containerName) {
	const { stdout, stderr } = await execFile('docker', ['logs', '--tail', '200', containerName], {
		maxBuffer: 1024 * 1024 * 5,
		env: process.env,
	});

	return `${stdout}${stderr}`;
}

async function waitForStartup(containerName) {
	const deadline = Date.now() + STARTUP_TIMEOUT_MS;
	let lastLogs = '';

	while (Date.now() < deadline) {
		const { stdout: statusOutput } = await runCommand('docker', [
			'inspect',
			'--format',
			'{{.State.Status}}',
			containerName,
		]);
		const status = statusOutput.trim();
		lastLogs = await readContainerLogs(containerName);

		if (status === 'exited') {
			throw new Error(
				`Docker smoke container exited before n8n became ready.\nRecent logs:\n${lastLogs}`,
			);
		}

		if (lastLogs.includes('Editor is now accessible via:')) {
			return lastLogs;
		}

		await sleep(1_000);
	}

	throw new Error(
		`Timed out waiting for n8n startup after ${STARTUP_TIMEOUT_MS}ms.\nRecent logs:\n${lastLogs}`,
	);
}

async function readInstalledPackageVersion(containerName) {
	const { stdout } = await runCommand('docker', [
		'exec',
		containerName,
		'sh',
		'-lc',
		'node -p "require(\'/home/node/.n8n/nodes/node_modules/@gonkagate/n8n-nodes-gonkagate/package.json\').version"',
	]);

	return stdout.trim();
}

async function exportNodeCatalog(containerName) {
	const { stdout } = await runCommand('docker', [
		'exec',
		containerName,
		'sh',
		'-lc',
		'tmp=$(mktemp) && n8n export:nodes --output="$tmp" >/dev/null && cat "$tmp"',
	]);

	return JSON.parse(stdout);
}

function assertExpectedNodes(nodes, startupLogs) {
	const foundDisplayNames = new Set(
		nodes
			.map((node) => node.displayName)
			.filter((displayName) => typeof displayName === 'string' && displayName.length > 0),
	);
	const missingNodes = EXPECTED_NODE_DISPLAY_NAMES.filter((name) => !foundDisplayNames.has(name));

	if (missingNodes.length > 0) {
		throw new Error(
			`n8n started but did not register the expected GonkaGate nodes: ${missingNodes.join(', ')}.\nRecent logs:\n${startupLogs}`,
		);
	}

	if (startupLogs.includes("Cannot find module 'ai-node-sdk'")) {
		throw new Error(`n8n startup logs still show ai-node-sdk resolution failures.\n${startupLogs}`);
	}
}

async function cleanupArtifacts(containerName, volumeName) {
	await execFile('docker', ['rm', '-f', containerName], {
		maxBuffer: 1024 * 1024 * 5,
		env: process.env,
	}).catch(() => undefined);
	await execFile('docker', ['volume', 'rm', volumeName], {
		maxBuffer: 1024 * 1024 * 5,
		env: process.env,
	}).catch(() => undefined);
}

async function runSmokeCheck(image, keepArtifacts) {
	const suffix = randomUUID().slice(0, 8);
	const containerName = `gonkagate-docker-smoke-${suffix}`;
	const volumeName = `gonkagate-docker-smoke-${suffix}`;

	try {
		await runCommand('docker', ['volume', 'create', volumeName]);
		await runCommand('docker', [
			'run',
			'-d',
			'--name',
			containerName,
			'-e',
			'GENERIC_TIMEZONE=UTC',
			'-e',
			'TZ=UTC',
			'-e',
			'N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true',
			'-v',
			`${volumeName}:/home/node/.n8n`,
			image,
		]);

		const startupLogs = await waitForStartup(containerName);
		const installedPackageVersion = await readInstalledPackageVersion(containerName);
		const nodes = await exportNodeCatalog(containerName);

		assertExpectedNodes(nodes, startupLogs);

		return {
			ok: true,
			image,
			installedPackageVersion,
			registeredNodes: EXPECTED_NODE_DISPLAY_NAMES,
			...(keepArtifacts ? { containerName, volumeName } : {}),
		};
	} finally {
		if (!keepArtifacts) {
			await cleanupArtifacts(containerName, volumeName);
		}
	}
}

async function main() {
	const { image, keepArtifacts } = parseArgs(process.argv.slice(2));
	const report = await runSmokeCheck(image, keepArtifacts);

	process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

await main().catch((error) => {
	console.error(error);
	process.exit(1);
});
