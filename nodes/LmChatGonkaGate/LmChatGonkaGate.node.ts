import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { gonkaGateChatModelProperties } from '../../shared/GonkaGate/chatModelParameters';
import { supplyGonkaGateChatModel } from '../../shared/GonkaGate/chatModel';
import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import { GONKAGATE_MODEL_SELECTOR_FEATURES } from '../../shared/GonkaGate/modelParameter';
import {
	GONKAGATE_CHAT_MODEL_DESCRIPTION,
	GONKAGATE_CHAT_MODEL_DISPLAY_NAME,
	GONKAGATE_NODE_ICON,
} from '../../shared/GonkaGate/metadata';

const gonkaGateChatModelNodeProperties = [...gonkaGateChatModelProperties];

export class LmChatGonkaGate implements INodeType {
	methods = GONKAGATE_MODEL_SELECTOR_FEATURES.methods;

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
		properties: gonkaGateChatModelNodeProperties,
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		return await supplyGonkaGateChatModel(this, itemIndex);
	}
}
