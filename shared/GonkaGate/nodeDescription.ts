import type { INodeProperties, INodeTypeDescription } from 'n8n-workflow';

import { GONKAGATE_NODE_ICON } from './metadata';
import { GONKAGATE_NODE_CREDENTIALS } from './nodeCredentials';

type GonkaGateNodeDescriptionInput = Pick<
	INodeTypeDescription,
	'displayName' | 'name' | 'description' | 'inputs' | 'outputs'
> & {
	properties: readonly INodeProperties[];
	subtitle?: INodeTypeDescription['subtitle'];
	usableAsTool?: INodeTypeDescription['usableAsTool'];
};

export function createGonkaGateNodeDescription(
	input: GonkaGateNodeDescriptionInput,
): INodeTypeDescription {
	return {
		displayName: input.displayName,
		name: input.name,
		icon: GONKAGATE_NODE_ICON,
		group: ['transform'],
		version: [1],
		description: input.description,
		defaults: {
			name: input.displayName,
		},
		inputs: input.inputs,
		outputs: input.outputs,
		credentials: [...GONKAGATE_NODE_CREDENTIALS],
		properties: [...input.properties],
		...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
		...(input.usableAsTool !== undefined ? { usableAsTool: input.usableAsTool } : {}),
	};
}
