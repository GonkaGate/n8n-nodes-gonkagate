import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import {
	createGonkaGateChatModelOptionsProperty,
	createGonkaGateStreamingProperty,
} from '../../shared/GonkaGate/chatParameters';
import { supplyGonkaGateChatModel } from '../../shared/GonkaGate/chatModel';
import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import {
	createGonkaGateModelSearchMethods,
	createGonkaGateModelSelectorProperty,
} from '../../shared/GonkaGate/modelParameter';

export class LmChatGonkaGate implements INodeType {
	methods = createGonkaGateModelSearchMethods();

	description: INodeTypeDescription = {
		displayName: 'GonkaGate Chat Model',
		name: 'lmChatGonkaGate',
		icon: 'file:gonkagate.svg',
		group: ['transform'],
		version: [1],
		description:
			'Use GonkaGate chat-completions models in AI workflows while keeping the provider-branded GonkaGate package surface',
		defaults: {
			name: 'GonkaGate Chat Model',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiLanguageModel],
		credentials: [
			{
				name: GONKAGATE_CREDENTIAL_NAME,
				required: true,
			},
		],
		properties: [
			createGonkaGateModelSelectorProperty(),
			createGonkaGateStreamingProperty(),
			createGonkaGateChatModelOptionsProperty(),
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		return await supplyGonkaGateChatModel(this, itemIndex);
	}
}
