import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { requestGonkaGateModels } from '../../../shared/GonkaGate/modelsApi';

export const GONKAGATE_LIST_MODELS_OPERATION_ACTION = 'List models exposed by GonkaGate';

export const GONKAGATE_LIST_MODELS_OPERATION_DESCRIPTION =
	'List the models currently exposed by GonkaGate';

export async function executeListModels(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const response = await requestGonkaGateModels(context, { itemIndex });

	return [{ json: response }];
}
