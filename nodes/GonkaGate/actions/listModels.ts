import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import {
	createListModelsRequestOptions,
	parseGonkaGateModelsApiResponse,
} from '../../../shared/GonkaGate/modelsApi';
import { GONKAGATE_LIST_MODELS_OPERATION_NAME } from '../../../shared/GonkaGate/operationNames';
import { gonkaGateRequest } from '../../../shared/GonkaGate/request';
import { createGonkaGateJsonOutput } from '../output';

export const GONKAGATE_LIST_MODELS_OPERATION_ACTION = 'List available models';

export const GONKAGATE_LIST_MODELS_OPERATION_DESCRIPTION =
	'List the models currently exposed by GonkaGate';

export async function executeListModels(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const response = await gonkaGateRequest(
		context,
		GONKAGATE_LIST_MODELS_OPERATION_NAME,
		createListModelsRequestOptions(),
		{
			itemIndex,
			parseResponse: parseGonkaGateModelsApiResponse,
		},
	);

	return createGonkaGateJsonOutput(response);
}
