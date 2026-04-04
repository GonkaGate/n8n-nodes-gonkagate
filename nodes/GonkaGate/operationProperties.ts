import type { IDisplayOptions, INodeProperties } from 'n8n-workflow';

import { GONKAGATE_OPERATION_PARAMETER_NAME } from '../../shared/GonkaGate/parameters';
import { getGonkaGateOperationDefinitions } from './operationDefinitions';
import { GONKAGATE_DEFAULT_OPERATION, type GonkaGateOperation } from './operationTypes';

export function createGonkaGateOperationProperty(): INodeProperties {
	return {
		displayName: 'Operation',
		name: GONKAGATE_OPERATION_PARAMETER_NAME,
		type: 'options',
		noDataExpression: true,
		default: GONKAGATE_DEFAULT_OPERATION,
		options: getGonkaGateOperationDefinitions().map((operationDefinition) => ({
			name: operationDefinition.displayName,
			value: operationDefinition.operation,
			action: operationDefinition.action,
			description: operationDefinition.description,
		})),
	};
}

export function getGonkaGateOperationProperties(): INodeProperties[] {
	return getGonkaGateOperationDefinitions().flatMap((operationDefinition) =>
		operationDefinition.properties.map((property: INodeProperties) =>
			withOperationDisplayOptions(operationDefinition.operation, property),
		),
	);
}

function withOperationDisplayOptions(
	operation: GonkaGateOperation,
	property: INodeProperties,
): INodeProperties {
	return {
		...property,
		displayOptions: mergeDisplayOptions(property.displayOptions, operation),
	};
}

function mergeDisplayOptions(
	displayOptions: IDisplayOptions | undefined,
	operation: GonkaGateOperation,
): IDisplayOptions {
	return {
		...(displayOptions ?? {}),
		show: {
			...(displayOptions?.show ?? {}),
			[GONKAGATE_OPERATION_PARAMETER_NAME]: [operation],
		},
	};
}
