import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { createStrictContext } from './createStrictContext';
import { createGonkaGateTestNode } from './gonkaGateTestContext';

export type LoadOptionsContextOptions = {
	hasCredentials: boolean;
	httpRequestWithAuthentication: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
};
type LoadOptionsContextMock = {
	getNode(): ReturnType<typeof createGonkaGateTestNode>;
	helpers: Pick<ILoadOptionsFunctions['helpers'], 'httpRequestWithAuthentication'>;
};

export function createLoadOptionsContext(
	options: LoadOptionsContextOptions,
): ILoadOptionsFunctions {
	const node = createGonkaGateTestNode({
		hasCredentials: options.hasCredentials,
	});
	const context = {
		getNode() {
			return node;
		},
		helpers: {
			httpRequestWithAuthentication: options.httpRequestWithAuthentication,
		},
	} satisfies LoadOptionsContextMock;

	return createStrictContext<ILoadOptionsFunctions, LoadOptionsContextMock>(
		context,
		'ILoadOptionsFunctions',
	);
}
