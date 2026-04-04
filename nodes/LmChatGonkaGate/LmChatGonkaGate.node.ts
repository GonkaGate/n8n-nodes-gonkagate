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
import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import {
	GONKAGATE_MODEL_SELECTOR_METHODS,
	GONKAGATE_MODEL_SELECTOR_PROPERTY,
} from '../../shared/GonkaGate/modelParameter';
import {
	GONKAGATE_CHAT_MODEL_DESCRIPTION,
	GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
	GONKAGATE_NODE_ICON,
} from '../../shared/GonkaGate/metadata';

const gonkaGateChatModelNodeProperties: readonly INodeProperties[] = [
	GONKAGATE_MODEL_SELECTOR_PROPERTY,
	createGonkaGateStreamingProperty(),
	createGonkaGateChatModelOptionsProperty(),
] as const;

export class LmChatGonkaGate implements INodeType {
	methods = GONKAGATE_MODEL_SELECTOR_METHODS;

	description: INodeTypeDescription = {
		displayName: GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
		name: 'lmChatGonkaGate',
		icon: GONKAGATE_NODE_ICON,
		group: ['transform'],
		version: [1],
		description: GONKAGATE_CHAT_MODEL_DESCRIPTION,
		defaults: {
			name: GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		credentials: [
			{
				name: GONKAGATE_CREDENTIAL_NAME,
				required: true,
			},
		],
		properties: [...gonkaGateChatModelNodeProperties],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		return await supplyGonkaGateChatModel(this, itemIndex);
	}
}
