import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INode,
	INodeExecutionData,
	INodeParameterResourceLocator,
	ISupplyDataFunctions,
} from 'n8n-workflow';

import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';

export function createNode(): INode {
	return {
		id: '1',
		name: 'Test Node',
		type: 'test.node',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	};
}

export function createModelResourceLocator(value: string): INodeParameterResourceLocator {
	return {
		__rl: true,
		mode: 'id',
		value,
	};
}

export function createExecuteContext(input: {
	parameters: Array<Record<string, unknown>>;
	httpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
	continueOnFail?: boolean;
	inputData?: INodeExecutionData[];
}): IExecuteFunctions {
	const inputData = input.inputData ?? [];

	return {
		getInputData() {
			return inputData;
		},
		getNode() {
			return createNode();
		},
		getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown) {
			return input.parameters[itemIndex]?.[parameterName] ?? fallbackValue;
		},
		continueOnFail() {
			return input.continueOnFail ?? false;
		},
		helpers: {
			httpRequestWithAuthentication: input.httpRequest,
		},
	} as unknown as IExecuteFunctions;
}

export function createLoadOptionsContext(input: {
	credentialsSelected: boolean;
	httpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
}): ILoadOptionsFunctions {
	return {
		getNode() {
			return {
				...createNode(),
				credentials: input.credentialsSelected
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
			httpRequestWithAuthentication: input.httpRequest,
		},
	} as unknown as ILoadOptionsFunctions;
}

export function createSupplyContext(input: {
	credentials: Record<string, unknown>;
	parameters: Record<string, unknown>;
}): ISupplyDataFunctions {
	return {
		getNode() {
			return createNode();
		},
		async getCredentials() {
			return input.credentials;
		},
		getNodeParameter(parameterName: string, _itemIndex: number, fallbackValue?: unknown) {
			return input.parameters[parameterName] ?? fallbackValue;
		},
	} as unknown as ISupplyDataFunctions;
}
