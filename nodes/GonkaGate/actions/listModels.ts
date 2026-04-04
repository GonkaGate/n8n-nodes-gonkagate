import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

import { createListModelsRequestOptions } from '../../shared/GonkaGate/modelsApi';
import { gonkaGateRequest } from '../../shared/GonkaGate/request';
import { createGonkaGateJsonOutput } from '../operations';

export async function executeListModels(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const response = await gonkaGateRequest(
		context,
		'List Models',
		createListModelsRequestOptions(),
		itemIndex,
	);

	return createGonkaGateJsonOutput(response);
}
