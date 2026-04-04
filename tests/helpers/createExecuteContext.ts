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

export function createExecuteContext(options: ExecuteContextOptions): IExecuteFunctions {
	const inputItems = options.inputItems ?? [];

	return createStrictContext(
		{
			getInputData() {
				return inputItems;
			},
			getNode() {
				return createTestNode();
			},
			getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown) {
				if (options.getNodeParameter !== undefined) {
					return options.getNodeParameter(parameterName, itemIndex, fallbackValue);
				}

				return options.itemParameters[itemIndex]?.[parameterName] ?? fallbackValue;
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
