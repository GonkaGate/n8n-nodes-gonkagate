import process from 'node:process';

if (process.env.GITHUB_ACTIONS === 'true') {
	console.log('Publish context check passed in GitHub Actions.');
	process.exit(0);
}

console.error(
	'Direct npm publish is disabled. Use the GitHub Actions publish workflow, or create a release through the repository release flow instead.',
);
process.exit(1);
