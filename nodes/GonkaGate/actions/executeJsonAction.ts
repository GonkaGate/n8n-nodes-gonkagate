import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

export async function executeGonkaGateJsonAction<TResponse extends IDataObject>(
	loadResponse: () => Promise<TResponse>,
): Promise<INodeExecutionData[]> {
	return [{ json: await loadResponse() }];
}
