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
				return {
					...createTestNode(),
					credentials: options.credentialsAttached
						? {
								[GONKAGATE_CREDENTIAL_NAME]: {
									id: '1',
									name: 'Test GonkaGate Credential',
								},
							}
						: undefined,
				};
			},
			helpers: {
				httpRequestWithAuthentication: options.authenticatedHttpRequest,
			},
		},
		'ILoadOptionsFunctions',
	) as unknown as ILoadOptionsFunctions;
}
