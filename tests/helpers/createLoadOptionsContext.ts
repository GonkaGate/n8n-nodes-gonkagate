import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import { createStrictContext } from './createStrictContext';
import { createTestNode } from './createTestNode';

export type LoadOptionsContextOptions = {
	hasCredentials: boolean;
	httpRequestWithAuthentication: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
};
type LoadOptionsContextMock = {
	getNode(): ReturnType<typeof createLoadOptionsTestNode>;
	helpers: Pick<ILoadOptionsFunctions['helpers'], 'httpRequestWithAuthentication'>;
};

export function createLoadOptionsContext(
	options: LoadOptionsContextOptions,
): ILoadOptionsFunctions {
	const context = {
		getNode() {
			return createLoadOptionsTestNode(options.hasCredentials);
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

function createLoadOptionsTestNode(hasCredentials: boolean) {
	return {
		...createTestNode(),
		credentials: hasCredentials ? createGonkaGateCredentialReference() : undefined,
	};
}

function createGonkaGateCredentialReference() {
	return {
		[GONKAGATE_CREDENTIAL_NAME]: {
			id: '1',
			name: 'Test GonkaGate Credential',
		},
	};
}
