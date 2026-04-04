import type { ILoadOptionsFunctions } from 'n8n-workflow';

import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import { createStrictContext } from './createStrictContext';
import { createTestNode } from './createTestNode';

export type LoadOptionsContextOptions = {
	hasCredentials: boolean;
	httpRequestWithAuthentication: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
};

export function createLoadOptionsContext(
	options: LoadOptionsContextOptions,
): ILoadOptionsFunctions {
	return createStrictContext(
		{
			getNode() {
				return createLoadOptionsTestNode(options.hasCredentials);
			},
			helpers: {
				httpRequestWithAuthentication: options.httpRequestWithAuthentication,
			},
		},
		'ILoadOptionsFunctions',
	) as unknown as ILoadOptionsFunctions;
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
