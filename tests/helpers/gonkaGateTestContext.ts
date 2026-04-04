import type { INode } from 'n8n-workflow';

import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';

export type GonkaGateTestNodeParameters = Record<string, unknown>;

export function createGonkaGateTestNode(
	input: {
		hasCredentials?: boolean;
	} = {},
): INode {
	return {
		id: '1',
		name: 'Test Node',
		type: 'test.node',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
		...(input.hasCredentials ? { credentials: createGonkaGateCredentialReference() } : {}),
	};
}

export function createGonkaGateCredentialReference() {
	return {
		[GONKAGATE_CREDENTIAL_NAME]: {
			id: '1',
			name: 'Test GonkaGate Credential',
		},
	};
}

export function createIndexedParameterReader(itemParameters: GonkaGateTestNodeParameters[]) {
	return (parameterName: string, itemIndex: number, fallbackValue?: unknown) =>
		resolveGonkaGateTestParameter(itemParameters[itemIndex], parameterName, fallbackValue);
}

export function createSingleParameterReader(
	parameters: GonkaGateTestNodeParameters,
	expectedItemIndex = 0,
) {
	return (parameterName: string, itemIndex: number, fallbackValue?: unknown) => {
		assertExpectedItemIndex(itemIndex, expectedItemIndex, 'parameter');

		return resolveGonkaGateTestParameter(parameters, parameterName, fallbackValue);
	};
}

export function resolveGonkaGateTestParameter(
	parameters: GonkaGateTestNodeParameters | undefined,
	parameterName: string,
	fallbackValue?: unknown,
): unknown {
	return parameters?.[parameterName] ?? fallbackValue;
}

export function assertExpectedItemIndex(
	itemIndex: number,
	expectedItemIndex = 0,
	itemType: 'parameter' | 'credential',
): void {
	if (itemIndex !== expectedItemIndex) {
		throw new Error(`Unexpected ${itemType} item index: ${itemIndex}`);
	}
}
