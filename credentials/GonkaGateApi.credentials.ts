import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

import {
	authenticateGonkaGateRequest,
	createListModelsRequestOptions,
	GONKAGATE_BASE_URL,
	GONKAGATE_CREDENTIAL_NAME,
} from '../nodes/shared/GonkaGate';

export class GonkaGateApi implements ICredentialType {
	name = GONKAGATE_CREDENTIAL_NAME;

	displayName = 'GonkaGate API';

	icon: Icon = 'file:../nodes/GonkaGate/gonkagate.svg';

	documentationUrl = 'https://github.com/GonkaGate/n8n-nodes-gonkagate#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'API key used to authenticate requests to GonkaGate',
		},
		{
			displayName: 'Base URL',
			name: 'url',
			type: 'hidden',
			default: GONKAGATE_BASE_URL,
		},
	];

	test: ICredentialTestRequest = {
		request: createListModelsRequestOptions(),
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		return await authenticateGonkaGateRequest(credentials, requestOptions);
	}
}
