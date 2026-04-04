import type { INodeParameterResourceLocator } from 'n8n-workflow';

import { createGonkaGateTestNode } from './gonkaGateTestContext';

export function createTestNode() {
	return createGonkaGateTestNode();
}

export function createModelResourceLocator(value: string): INodeParameterResourceLocator {
	return {
		__rl: true,
		mode: 'id',
		value,
	};
}
