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
	getNodeParameter?: (parameterName: string, itemIndex: number, fallbackValue?: unknown) => unknown;
}): IExecuteFunctions {
	const inputData = input.inputData ?? [];

	return asStrictContext(
		{
			getInputData() {
				return inputData;
			},
			getNode() {
				return createNode();
			},
			getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown) {
				if (input.getNodeParameter !== undefined) {
					return input.getNodeParameter(parameterName, itemIndex, fallbackValue);
				}

				return input.parameters[itemIndex]?.[parameterName] ?? fallbackValue;
			},
			continueOnFail() {
				return input.continueOnFail ?? false;
			},
			helpers: {
				httpRequestWithAuthentication: input.httpRequest,
			},
		},
		'IExecuteFunctions',
	) as unknown as IExecuteFunctions;
}

export function createLoadOptionsContext(input: {
	credentialsSelected: boolean;
	httpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
}): ILoadOptionsFunctions {
	return asStrictContext(
		{
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
		},
		'ILoadOptionsFunctions',
	) as unknown as ILoadOptionsFunctions;
}

export function createSupplyContext(input: {
	credentials: Record<string, unknown>;
	parameters: Record<string, unknown>;
}): ISupplyDataFunctions {
	return asStrictContext(
		{
			getNode() {
				return createNode();
			},
			async getCredentials() {
				return input.credentials;
			},
			getNodeParameter(parameterName: string, _itemIndex: number, fallbackValue?: unknown) {
				return input.parameters[parameterName] ?? fallbackValue;
			},
		},
		'ISupplyDataFunctions',
	) as unknown as ISupplyDataFunctions;
}

function asStrictContext<T extends object>(context: T, label: string): T {
	return new Proxy(context, {
		get(target, property, receiver) {
			if (typeof property === 'symbol' || property in target) {
				return Reflect.get(target, property, receiver);
			}

			throw new Error(`${label} mock does not implement ${String(property)}`);
		},
	});
}
