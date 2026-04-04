import type { ISupplyDataFunctions } from 'n8n-workflow';

import type { GonkaGateCredentialData } from '../../shared/GonkaGate/credentials';
import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import { createStrictContext } from './createStrictContext';
import { createTestNode } from './createTestNode';
import {
	assertExpectedTestItemIndex,
	createSingleItemTestNodeParameterResolver,
} from './testContextAccess';

export type SupplyDataContextOptions = {
	credentials: GonkaGateCredentialData;
	parameters: Record<string, unknown>;
	credentialItemIndex?: number;
	parameterItemIndex?: number;
	getCredentials?: (
		credentialName: string,
		itemIndex: number,
	) => Promise<GonkaGateCredentialData> | GonkaGateCredentialData;
};
type SupplyDataContextMock = {
	getCredentials(
		credentialName: string,
		itemIndex: number,
	): Promise<GonkaGateCredentialData>;
	getNode(): ReturnType<typeof createTestNode>;
	getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown): unknown;
};

export function createSupplyDataContext(options: SupplyDataContextOptions): ISupplyDataFunctions {
	const resolveNodeParameter = createSingleItemTestNodeParameterResolver(
		options.parameters,
		options.parameterItemIndex ?? 0,
	);
	const context = {
		getNode() {
			return createTestNode();
		},
		async getCredentials(credentialName: string, itemIndex: number) {
			if (options.getCredentials !== undefined) {
				return await options.getCredentials(credentialName, itemIndex);
			}

			return resolveTestCredentials(options, credentialName, itemIndex);
		},
		getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown) {
			return resolveNodeParameter(parameterName, itemIndex, fallbackValue);
		},
	} satisfies SupplyDataContextMock;

	return createStrictContext<ISupplyDataFunctions, SupplyDataContextMock>(
		context,
		'ISupplyDataFunctions',
	);
}

function resolveTestCredentials(
	options: SupplyDataContextOptions,
	credentialName: string,
	itemIndex: number,
): GonkaGateCredentialData {
	if (credentialName !== GONKAGATE_CREDENTIAL_NAME) {
		throw new Error(`Unexpected credential lookup: ${credentialName}`);
	}

	assertExpectedTestItemIndex(itemIndex, options.credentialItemIndex ?? 0, 'credential');

	return options.credentials;
}
