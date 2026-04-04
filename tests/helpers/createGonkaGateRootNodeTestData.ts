import { GonkaGate } from '../../nodes/GonkaGate/GonkaGate.node';
import {
	GONKAGATE_CHAT_COMPLETION_OPERATION,
	GONKAGATE_LIST_MODELS_OPERATION,
} from '../../nodes/GonkaGate/operationTypes';
import {
	GONKAGATE_MESSAGES_PARAMETER_NAME,
	GONKAGATE_MODEL_PARAMETER_NAME,
	GONKAGATE_OPERATION_PARAMETER_NAME,
} from '../../shared/GonkaGate/parameters';
import { createGonkaGateChatTestParameters } from './createGonkaGateChatParameters';
import { createExecuteContext, type ExecuteContextOptions } from './createExecuteContext';
import {
	createBoundaryTimeoutError,
	createRecoverableTimeoutError,
} from './createGonkaGateErrorFixtures';

export function executeGonkaGateRootNode(options: ExecuteContextOptions) {
	const node = new GonkaGate();

	return node.execute.call(createExecuteContext(options));
}

export function createChatCompletionItemParameters(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	const chatParameters = createGonkaGateChatTestParameters();

	return {
		[GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_CHAT_COMPLETION_OPERATION,
		[GONKAGATE_MODEL_PARAMETER_NAME]: chatParameters.model,
		[GONKAGATE_MESSAGES_PARAMETER_NAME]: chatParameters.messages,
		...overrides,
	};
}

export function createListModelsItemParameters(): Record<string, unknown> {
	return {
		[GONKAGATE_OPERATION_PARAMETER_NAME]: GONKAGATE_LIST_MODELS_OPERATION,
	};
}

export function createBoundaryFailureParameterResolver() {
	const chatParameters = createGonkaGateChatTestParameters();

	return (parameterName: string, itemIndex: number, fallbackValue?: unknown) => {
		if (parameterName === GONKAGATE_MESSAGES_PARAMETER_NAME) {
			throw createBoundaryTimeoutError('req_boundary');
		}

		if (itemIndex !== 0) {
			return fallbackValue;
		}

		if (parameterName === GONKAGATE_OPERATION_PARAMETER_NAME) {
			return GONKAGATE_CHAT_COMPLETION_OPERATION;
		}

		if (parameterName === GONKAGATE_MODEL_PARAMETER_NAME) {
			return chatParameters.model;
		}

		return fallbackValue;
	};
}

export { createBoundaryTimeoutError, createRecoverableTimeoutError };
