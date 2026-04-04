import type {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

import { GONKAGATE_BASE_URL } from '../shared/GonkaGate/constants';
import {
	authenticateGonkaGateRequest,
	createGonkaGateCredentialTestRequest,
} from '../shared/GonkaGate/credentials';
import { GONKAGATE_CREDENTIAL_NAME } from '../shared/GonkaGate/identifiers';
import {
	GONKAGATE_API_KEY_DESCRIPTION,
	GONKAGATE_CREDENTIAL_DISPLAY_NAME,
	GONKAGATE_CREDENTIAL_DOCUMENTATION_URL,
	GONKAGATE_CREDENTIAL_ICON,
} from '../shared/GonkaGate/metadata';

export class GonkaGateApi implements ICredentialType {
	name = GONKAGATE_CREDENTIAL_NAME;

	displayName = GONKAGATE_CREDENTIAL_DISPLAY_NAME;

	icon: Icon = GONKAGATE_CREDENTIAL_ICON;

	documentationUrl = GONKAGATE_CREDENTIAL_DOCUMENTATION_URL;

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
			description: GONKAGATE_API_KEY_DESCRIPTION,
		},
		{
			displayName: 'Base URL',
			name: 'url',
			type: 'hidden',
			default: GONKAGATE_BASE_URL,
		},
	];

	test: ICredentialTestRequest = {
		request: createGonkaGateCredentialTestRequest(),
	};

	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		return await authenticateGonkaGateRequest(credentials, requestOptions);
	}
}
