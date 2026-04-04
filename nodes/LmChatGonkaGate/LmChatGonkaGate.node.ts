import type {
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { supplyGonkaGateChatModel } from '../../shared/GonkaGate/chatModel';
import { createGonkaGateStreamingProperty } from '../../shared/GonkaGate/chatModelParameters';
import { createGonkaGateChatModelOptionsProperty } from '../../shared/GonkaGate/chatOptions';
import {
	GONKAGATE_MODEL_SELECTOR_METHODS,
	GONKAGATE_MODEL_SELECTOR_PROPERTY,
} from '../../shared/GonkaGate/modelParameter';
import {
	GONKAGATE_CHAT_MODEL_DESCRIPTION,
	GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
} from '../../shared/GonkaGate/metadata';
import { createGonkaGateNodeDescription } from '../../shared/GonkaGate/nodeDescription';

const gonkaGateChatModelNodeProperties: readonly INodeProperties[] = [
	GONKAGATE_MODEL_SELECTOR_PROPERTY,
	createGonkaGateStreamingProperty(),
	createGonkaGateChatModelOptionsProperty(),
] as const;

export class LmChatGonkaGate implements INodeType {
	methods = GONKAGATE_MODEL_SELECTOR_METHODS;

	description: INodeTypeDescription = createGonkaGateNodeDescription({
		displayName: GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
		name: 'lmChatGonkaGate',
		description: GONKAGATE_CHAT_MODEL_DESCRIPTION,
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		properties: gonkaGateChatModelNodeProperties,
	});

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		return await supplyGonkaGateChatModel(this, itemIndex);
	}
}
