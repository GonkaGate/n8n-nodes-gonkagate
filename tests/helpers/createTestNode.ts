import type { INode, INodeParameterResourceLocator } from 'n8n-workflow';

export function createTestNode(): INode {
	return {
		id: '1',
		name: 'Test Node',
		type: 'test.node',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	};
}

export function createModelResourceLocator(value: string): INodeParameterResourceLocator {
	return {
		__rl: true,
		mode: 'id',
		value,
	};
}
