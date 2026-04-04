export type TestNodeParameters = Record<string, unknown>;

export function createIndexedTestNodeParameterResolver(
	itemParameters: TestNodeParameters[],
) {
	return (parameterName: string, itemIndex: number, fallbackValue?: unknown) =>
		resolveTestNodeParameter(itemParameters[itemIndex], parameterName, fallbackValue);
}

export function resolveTestNodeParameter(
	parameters: TestNodeParameters | undefined,
	parameterName: string,
	fallbackValue?: unknown,
): unknown {
	return parameters?.[parameterName] ?? fallbackValue;
}

export function assertExpectedTestItemIndex(
	itemIndex: number,
	expectedItemIndex = 0,
	itemType: 'parameter' | 'credential',
): void {
	if (itemIndex !== expectedItemIndex) {
		throw new Error(`Unexpected ${itemType} item index: ${itemIndex}`);
	}
}
