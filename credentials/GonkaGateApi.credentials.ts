import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

import { GONKAGATE_BASE_URL } from '../shared/GonkaGate/constants';
import { authenticateGonkaGateRequest } from '../shared/GonkaGate/credentials';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import { createListModelsRequestOptions } from '../shared/GonkaGate/modelsApi';

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
