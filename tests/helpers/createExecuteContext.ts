import type { IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData } from 'n8n-workflow';

import { createStrictContext } from './createStrictContext';
import { createTestNode } from './createTestNode';

export type ExecuteContextOptions = {
	itemParameters: Array<Record<string, unknown>>;
	httpRequestWithAuthentication: ILoadOptionsFunctions['helpers']['httpRequestWithAuthentication'];
	continueOnFail?: boolean;
	inputItems?: INodeExecutionData[];
	getNodeParameter?: (parameterName: string, itemIndex: number, fallbackValue?: unknown) => unknown;
};

type NodeParameterResolver = ExecuteContextOptions['getNodeParameter'];
type ExecuteContextMock = {
	continueOnFail(): boolean;
	getInputData(): INodeExecutionData[];
	getNode(): ReturnType<typeof createTestNode>;
	getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown): unknown;
	helpers: Pick<IExecuteFunctions['helpers'], 'httpRequestWithAuthentication'>;
};

export function createExecuteContext(options: ExecuteContextOptions): IExecuteFunctions {
	const inputItems = options.inputItems ?? [];
	const resolveNodeParameter =
		options.getNodeParameter ?? createDefaultNodeParameterResolver(options.itemParameters);

	const context = {
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
			httpRequestWithAuthentication: options.httpRequestWithAuthentication,
		},
	} satisfies ExecuteContextMock;

	return createStrictContext<IExecuteFunctions, ExecuteContextMock>(context, 'IExecuteFunctions');
}

function createDefaultNodeParameterResolver(
	itemParameters: Array<Record<string, unknown>>,
): NonNullable<NodeParameterResolver> {
	return (parameterName: string, itemIndex: number, fallbackValue?: unknown) =>
		itemParameters[itemIndex]?.[parameterName] ?? fallbackValue;
}
