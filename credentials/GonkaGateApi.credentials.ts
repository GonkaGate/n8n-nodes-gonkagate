import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

import { GONKAGATE_BASE_URL, GONKAGATE_MODELS_PATH } from '../nodes/GonkaGate/constants';
import { resolveGonkaGateBaseUrl } from '../nodes/GonkaGate/utils/credentials';

export class GonkaGateApi implements ICredentialType {
	name = 'gonkaGateApi';

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
		request: {
			method: 'GET',
			baseURL: '={{$credentials.url}}',
			url: GONKAGATE_MODELS_PATH,
		},
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const url = resolveGonkaGateBaseUrl(credentials.url);

		requestOptions.baseURL = requestOptions.baseURL ?? url;
		requestOptions.headers ??= {};
		requestOptions.headers.Authorization = `Bearer ${String(credentials.apiKey)}`;

		return requestOptions;
	}
}
