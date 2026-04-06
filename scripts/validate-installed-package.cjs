const path = require('node:path');
const { createRequire } = require('node:module');

async function main() {
	const packageDirectory = process.argv[2];

	if (typeof packageDirectory !== 'string' || packageDirectory.length === 0) {
		throw new Error('Missing installed package directory argument');
	}

	const sandboxRequire = createRequire(path.join(process.cwd(), 'package.json'));
	const { LazyPackageDirectoryLoader } = sandboxRequire('n8n-core');
	const loader = new LazyPackageDirectoryLoader(packageDirectory, [], []);
	await loader.loadAll();

	process.stdout.write(
		JSON.stringify({
			packageName: loader.packageName,
			nodes: Object.keys(loader.known.nodes),
			credentials: Object.keys(loader.known.credentials),
		}),
	);
}

void main().catch((error) => {
	console.error(error);
	process.exit(1);
});
