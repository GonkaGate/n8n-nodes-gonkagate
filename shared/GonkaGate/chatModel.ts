import { supplyModel } from 'ai-node-sdk';
import type { OpenAiModel } from 'ai-node-sdk';
import type { ISupplyDataFunctions, SupplyData } from 'n8n-workflow';

import {
	resolveGonkaGateChatParametersFromContext,
	type ResolvedGonkaGateChatParameters,
} from './chatParameters';
import {
	resolveRequiredGonkaGateConnectionConfig,
	type GonkaGateCredentialData,
} from './credentials';
import { runWithNormalizedGonkaGateError } from './errors';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';
import { GONKAGATE_CHAT_MODEL_DISPLAY_NAME } from './metadata';
import { createGonkaGateAiModelConnection } from './transport';

type GonkaGateSupplyModel = typeof supplyModel;

export function buildGonkaGateChatModelSupplyOptions(input: {
	context: Pick<ISupplyDataFunctions, 'getNode'>;
	credentials: GonkaGateCredentialData;
	chatParameters: ResolvedGonkaGateChatParameters;
	itemIndex: number;
}): OpenAiModel {
	const connection = resolveRequiredGonkaGateConnectionConfig(
		input.context.getNode(),
		input.credentials,
		input.itemIndex,
	);
	const modelConnection = createGonkaGateAiModelConnection(connection);

	return {
		type: 'openai',
		...modelConnection,
		model: input.chatParameters.model,
		useResponsesApi: false,
		streaming: input.chatParameters.stream,
		...input.chatParameters.aiModelOptions,
	};
}

export function createGonkaGateChatModelSupplier(
	supplyModelDependency: GonkaGateSupplyModel = supplyModel,
) {
	return async function supplyGonkaGateChatModel(
		context: ISupplyDataFunctions,
		itemIndex: number,
	): Promise<SupplyData> {
		return await runWithNormalizedGonkaGateError({
			node: context.getNode(),
			itemIndex,
			operationName: GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
			run: async () => {
				const credentials = await context.getCredentials(GONKAGATE_CREDENTIAL_NAME, itemIndex);
				const chatParameters = resolveGonkaGateChatParametersFromContext(context, itemIndex);

				return await supplyModelDependency(
					context,
					buildGonkaGateChatModelSupplyOptions({
						context,
						credentials,
						chatParameters,
						itemIndex,
					}),
				);
			},
		});
	};
}

export const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier();
