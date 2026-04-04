import type { IDataObject, INodeExecutionData } from 'n8n-workflow';

export function createGonkaGateJsonOutput(json: IDataObject): INodeExecutionData[] {
	return [{ json }];
}
