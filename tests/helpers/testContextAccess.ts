import {
	assertExpectedItemIndex,
	createIndexedParameterReader,
	createSingleParameterReader,
	resolveGonkaGateTestParameter,
	type GonkaGateTestNodeParameters,
} from './gonkaGateTestContext';

export type TestNodeParameters = GonkaGateTestNodeParameters;

export function createIndexedTestNodeParameterResolver(
	itemParameters: TestNodeParameters[],
) {
	return createIndexedParameterReader(itemParameters);
}

export function createSingleItemTestNodeParameterResolver(
	parameters: TestNodeParameters,
	expectedItemIndex = 0,
) {
	return createSingleParameterReader(parameters, expectedItemIndex);
}

export function resolveTestNodeParameter(
	parameters: TestNodeParameters | undefined,
	parameterName: string,
	fallbackValue?: unknown,
): unknown {
	return resolveGonkaGateTestParameter(parameters, parameterName, fallbackValue);
}

export function assertExpectedTestItemIndex(
	itemIndex: number,
	expectedItemIndex = 0,
	itemType: 'parameter' | 'credential',
): void {
	assertExpectedItemIndex(itemIndex, expectedItemIndex, itemType);
}
