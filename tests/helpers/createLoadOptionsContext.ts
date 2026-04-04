import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import { createStrictContext } from './createStrictContext';
import { createTestNode } from './createTestNode';

export type LoadOptionsContextOptions = {
	credentialsAttached: boolean;
	authenticatedHttpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
};

export function createLoadOptionsContext(
	options: LoadOptionsContextOptions,
): ILoadOptionsFunctions {
	return createStrictContext(
		{
			getNode() {
				return createLoadOptionsTestNode(options.credentialsAttached);
			},
			helpers: {
				httpRequestWithAuthentication: options.authenticatedHttpRequest,
			},
		},
		'ILoadOptionsFunctions',
	) as unknown as ILoadOptionsFunctions;
}

function createLoadOptionsTestNode(credentialsAttached: boolean) {
	return {
		...createTestNode(),
		credentials: credentialsAttached ? createGonkaGateCredentialReference() : undefined,
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
