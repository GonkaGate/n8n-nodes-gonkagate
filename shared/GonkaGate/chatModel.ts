import { supplyModel } from 'ai-node-sdk';
import type { OpenAiModel } from 'ai-node-sdk';
import type { ISupplyDataFunctions, SupplyData } from 'n8n-workflow';

import {
	resolveGonkaGateChatModelParametersFromContext,
} from './chatModelParameters';
import type { ResolvedGonkaGateChatParameters } from './chatParameters';
import { resolveRequiredGonkaGateConnectionConfig } from './credentials';
import { normalizeGonkaGateError } from './errors';
import { GONKAGATE_CREDENTIAL_NAME } from './identifiers';
import { GONKAGATE_CHAT_MODEL_DISPLAY_NAME } from './metadata';
import { createGonkaGateAiModelConnection } from './transport';

type GonkaGateSupplyModel = typeof supplyModel;

export function buildGonkaGateChatModelSupplyOptions(input: {
	context: Pick<ISupplyDataFunctions, 'getNode'>;
	credentials: Record<string, unknown>;
	chatParameters: ResolvedGonkaGateChatParameters;
	itemIndex: number;
}): OpenAiModel {
	const connection = resolveRequiredGonkaGateConnectionConfig(
		input.context.getNode(),
		input.credentials,
		input.itemIndex,
	);

	return {
		type: 'openai',
		...createGonkaGateAiModelConnection(connection),
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
		try {
			const credentials = await context.getCredentials(GONKAGATE_CREDENTIAL_NAME, itemIndex);
			const chatParameters = resolveGonkaGateChatModelParametersFromContext(context, itemIndex);

			return await supplyModelDependency(
				context,
				buildGonkaGateChatModelSupplyOptions({
					context,
					credentials,
					chatParameters,
					itemIndex,
				}),
			);
		} catch (error) {
			throw normalizeGonkaGateError(
				context.getNode(),
				error,
				itemIndex,
				GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
			);
		}
	};
}

export const supplyGonkaGateChatModel = createGonkaGateChatModelSupplier();
