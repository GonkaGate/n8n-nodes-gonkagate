import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { requestGonkaGateModelsResponse } from '../../../shared/GonkaGate/modelsApi';
import { executeGonkaGateJsonAction } from './executeJsonAction';

export const GONKAGATE_LIST_MODELS_OPERATION_ACTION = 'List models exposed by GonkaGate';

export const GONKAGATE_LIST_MODELS_OPERATION_DESCRIPTION =
	'List the models currently exposed by GonkaGate';

export async function executeListModels(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	return await executeGonkaGateJsonAction(async () =>
		requestGonkaGateModelsResponse(context, { itemIndex }),
	);
}
