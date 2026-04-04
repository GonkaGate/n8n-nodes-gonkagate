import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import {
	createGonkaGateChatModelOptionsProperty,
	supplyGonkaGateChatModel,
} from '../shared/GonkaGate/chatModel';
import {
	createGonkaGateModelSearchMethods,
	createGonkaGateModelSelectorProperty,
} from '../shared/GonkaGate/models';

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
				name: 'gonkaGateApi',
				required: true,
			},
		],
		properties: [
			createGonkaGateModelSelectorProperty(),
			{
				displayName: 'Enable Streaming',
				name: 'streaming',
				type: 'boolean',
				default: true,
				description:
					'Whether n8n AI workflows should use GonkaGate SSE streaming on /v1/chat/completions when the surrounding workflow path supports visible live streaming',
			},
			createGonkaGateChatModelOptionsProperty(),
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		return await supplyGonkaGateChatModel(this, itemIndex);
	}
}
