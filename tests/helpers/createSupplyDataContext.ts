import type { ISupplyDataFunctions } from 'n8n-workflow';

import { GONKAGATE_CREDENTIAL_NAME } from '../../shared/GonkaGate/identifiers';
import { createStrictContext } from './createStrictContext';
import { createTestNode } from './createTestNode';

export type SupplyDataContextOptions = {
	credentialData: Record<string, unknown>;
	nodeParameters: Record<string, unknown>;
	expectedCredentialItemIndex?: number;
	expectedNodeParameterItemIndex?: number;
	getCredentials?: (
		credentialName: string,
		itemIndex: number,
	) => Promise<Record<string, unknown>> | Record<string, unknown>;
};

export function createSupplyDataContext(options: SupplyDataContextOptions): ISupplyDataFunctions {
	return createStrictContext(
		{
			getNode() {
				return createTestNode();
			},
			async getCredentials(credentialName: string, itemIndex: number) {
				if (options.getCredentials !== undefined) {
					return await options.getCredentials(credentialName, itemIndex);
				}

				if (credentialName !== GONKAGATE_CREDENTIAL_NAME) {
					throw new Error(`Unexpected credential lookup: ${credentialName}`);
				}

				if (itemIndex !== (options.expectedCredentialItemIndex ?? 0)) {
					throw new Error(`Unexpected credential item index: ${itemIndex}`);
				}

				return options.credentialData;
			},
			getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown) {
				if (itemIndex !== (options.expectedNodeParameterItemIndex ?? 0)) {
					throw new Error(`Unexpected parameter item index: ${itemIndex}`);
				}

				return options.nodeParameters[parameterName] ?? fallbackValue;
			},
		},
		'ISupplyDataFunctions',
	) as unknown as ISupplyDataFunctions;
}
