import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData } from 'n8n-workflow';

import { createStrictContext } from './createStrictContext';
import { createTestNode } from './createTestNode';

export type ExecuteContextOptions = {
	itemParameters: Array<Record<string, unknown>>;
	authenticatedHttpRequest: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
	continueOnFail?: boolean;
	inputItems?: INodeExecutionData[];
	getNodeParameter?: (parameterName: string, itemIndex: number, fallbackValue?: unknown) => unknown;
};

type NodeParameterResolver = ExecuteContextOptions['getNodeParameter'];

export function createExecuteContext(options: ExecuteContextOptions): IExecuteFunctions {
	const inputItems = options.inputItems ?? [];
	const resolveNodeParameter =
		options.getNodeParameter ?? createDefaultNodeParameterResolver(options.itemParameters);

	return createStrictContext(
		{
			getInputData() {
				return inputItems;
			},
			getNode() {
				return createTestNode();
			},
			getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown) {
				return resolveNodeParameter(parameterName, itemIndex, fallbackValue);
			},
			continueOnFail() {
				return options.continueOnFail ?? false;
			},
			helpers: {
				httpRequestWithAuthentication: options.authenticatedHttpRequest,
			},
		},
		'IExecuteFunctions',
	) as unknown as IExecuteFunctions;
}

function createDefaultNodeParameterResolver(
	itemParameters: Array<Record<string, unknown>>,
): NonNullable<NodeParameterResolver> {
	return (parameterName: string, itemIndex: number, fallbackValue?: unknown) =>
		itemParameters[itemIndex]?.[parameterName] ?? fallbackValue;
}
