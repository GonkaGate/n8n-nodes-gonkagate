import { supplyModel } from 'ai-node-sdk';
import type { OpenAiModel } from 'ai-node-sdk';
import type { IDataObject, ISupplyDataFunctions, SupplyData } from 'n8n-workflow';

import { resolveRequiredGonkaGateConnectionConfig } from './credentials';
import { resolveGonkaGateChatParameters } from './chatParameters';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';

export function buildGonkaGateChatModelSupplyOptions(input: {
	context: Pick<ISupplyDataFunctions, 'getNode'>;
	credentials: Record<string, unknown>;
	model: unknown;
	streaming: boolean;
	options: IDataObject;
	itemIndex: number;
}): OpenAiModel {
	const connection = resolveRequiredGonkaGateConnectionConfig(
		input.context.getNode(),
		input.credentials,
		input.itemIndex,
	);
	const chatParameters = resolveGonkaGateChatParameters({
		node: input.context.getNode(),
		rawModel: input.model,
		rawStreaming: input.streaming,
		rawOptions: input.options,
		itemIndex: input.itemIndex,
	});

	return {
		type: 'openai',
		baseUrl: connection.baseUrl,
		apiKey: connection.apiKey,
		defaultHeaders: connection.defaultHeaders,
		model: chatParameters.model,
		useResponsesApi: false,
		streaming: chatParameters.stream,
		...chatParameters.aiModelOptions,
	};
}

export async function supplyGonkaGateChatModel(
	context: ISupplyDataFunctions,
	itemIndex: number,
): Promise<SupplyData> {
	const credentials = await context.getCredentials(GONKAGATE_CREDENTIAL_NAME, itemIndex);
	const options = context.getNodeParameter('options', itemIndex, {}) as IDataObject;

	return supplyModel(
		context,
		buildGonkaGateChatModelSupplyOptions({
			context,
			credentials,
			model: context.getNodeParameter('model', itemIndex),
			streaming: context.getNodeParameter('streaming', itemIndex, true) as boolean,
			options,
			itemIndex,
		}),
	);
}
