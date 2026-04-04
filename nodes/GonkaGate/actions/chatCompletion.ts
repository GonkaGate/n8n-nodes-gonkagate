import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

import {
	GONKAGATE_CHAT_COMPLETIONS_PATH,
	gonkaGateRequest,
	resolveGonkaGateModelId,
} from '../../shared/GonkaGate';
import { parseChatMessages } from '../utils/messages';

export async function executeChatCompletion(
	context: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const model = resolveGonkaGateModelId(
		context.getNode(),
		context.getNodeParameter('model', itemIndex),
		itemIndex,
	);
	const rawMessages = context.getNodeParameter('messages', itemIndex);

	const messages = parseChatMessages(context.getNode(), rawMessages, itemIndex);

	return await gonkaGateRequest(
		context,
		'Chat Completion',
		{
			method: 'POST',
			url: GONKAGATE_CHAT_COMPLETIONS_PATH,
			body: {
				model,
				messages,
				stream: false,
			},
		},
		itemIndex,
	);
}
