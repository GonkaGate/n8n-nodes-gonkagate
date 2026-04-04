import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import { GONKAGATE_MODELS_PATH, gonkaGateRequest } from '../../shared/GonkaGate';

export async function executeListModels(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	return await gonkaGateRequest(
		context,
		'List Models',
		{
			method: 'GET',
			url: GONKAGATE_MODELS_PATH,
		},
		itemIndex,
	);
}
