import type { IDataObject, INode, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

type GonkaGateErrorContext = {
	itemIndex?: number;
	requestId?: string;
	recoverable?: boolean;
};

type ErrorWithContext = {
	context?: GonkaGateErrorContext;
	httpCode?: string | null;
	description?: string;
};

const REQUEST_ID_HEADER_NAMES = [
	'x-request-id',
	'request-id',
	'x-gonkagate-request-id',
	'x-correlation-id',
];

const NETWORK_ERROR_MESSAGES: Record<string, string> = {
	ECONNREFUSED: 'Could not connect to GonkaGate',
	ENOTFOUND: 'Could not resolve the GonkaGate host name',
	ETIMEDOUT: 'The GonkaGate request timed out',
	ECONNRESET: 'The connection to GonkaGate was interrupted',
	EHOSTUNREACH: 'The GonkaGate host was unreachable',
};

export function normalizeGonkaGateError(
	node: INode,
	error: unknown,
	itemIndex: number,
	operationName: string,
): NodeApiError | NodeOperationError {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		attachErrorContext(error, itemIndex, {
			requestId: extractRequestId(error),
		});
		return error;
	}

	const requestId = extractRequestId(error);
	const description = buildErrorDescription(error, requestId);
	const primaryMessage = extractPrimaryMessage(error);
	const errorCode = extractString(error, 'code');

	if (errorCode && NETWORK_ERROR_MESSAGES[errorCode] !== undefined) {
		return attachErrorContext(
			new NodeOperationError(node, error as Error, {
				itemIndex,
				message: NETWORK_ERROR_MESSAGES[errorCode],
				description,
			}),
			itemIndex,
			{
				requestId,
				recoverable: true,
			},
		);
	}

	if (looksLikeHttpError(error)) {
		return attachErrorContext(
			new NodeApiError(node, error as JsonObject, {
				itemIndex,
				description,
			}),
			itemIndex,
			{
				requestId,
				recoverable: true,
			},
		);
	}

	return attachErrorContext(
		new NodeOperationError(node, error as Error, {
			itemIndex,
			message: primaryMessage ?? `GonkaGate ${operationName} failed`,
			description,
		}),
		itemIndex,
		{
			requestId,
			recoverable: false,
		},
	);
}

export function serializeGonkaGateError(error: unknown): IDataObject {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		const output: IDataObject = {
			error: error.message,
		};

		if (typeof error.description === 'string' && error.description.length > 0) {
			output.description = error.description;
		}

		if (error instanceof NodeApiError && error.httpCode !== null) {
			output.httpCode = error.httpCode;
		}

		const requestId = (error as ErrorWithContext).context?.requestId;

		if (typeof requestId === 'string' && requestId.length > 0) {
			output.requestId = requestId;
		}

		return output;
	}

	const requestId = extractRequestId(error);
	const description = buildErrorDescription(error, requestId);
	const httpCode = extractHttpCode(error);
	const primaryMessage = extractPrimaryMessage(error) ?? 'Unknown error';
	const output: IDataObject = {
		error: primaryMessage,
	};

	if (description !== undefined && description !== primaryMessage) {
		output.description = description;
	}

	if (httpCode !== undefined) {
		output.httpCode = httpCode;
	}

	if (requestId !== undefined) {
		output.requestId = requestId;
	}

	return output;
}

export function isRecoverableGonkaGateError(error: unknown): boolean {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		return (error as ErrorWithContext).context?.recoverable === true;
	}

	const errorCode = extractString(error, 'code');

	return (
		(errorCode !== undefined && NETWORK_ERROR_MESSAGES[errorCode] !== undefined) ||
		looksLikeHttpError(error)
	);
}

function attachErrorContext<T extends NodeApiError | NodeOperationError>(
	error: T,
	itemIndex: number,
	context: {
		requestId?: string;
		recoverable?: boolean;
	},
): T {
	const contextualError = error as ErrorWithContext;
	contextualError.context ??= {};
	contextualError.context.itemIndex ??= itemIndex;

	if (context.requestId !== undefined && context.requestId.length > 0) {
		contextualError.context.requestId ??= context.requestId;
	}

	if (context.recoverable !== undefined) {
		contextualError.context.recoverable ??= context.recoverable;
	}

	return error;
}

function buildErrorDescription(error: unknown, requestId?: string): string | undefined {
	const parts = [extractPrimaryMessage(error)];

	if (requestId !== undefined) {
		parts.push(`Request ID: ${requestId}`);
	}

	const description = parts
		.filter((part): part is string => part !== undefined && part.length > 0)
		.join('\n');

	return description.length > 0 ? description : undefined;
}

function extractPrimaryMessage(error: unknown): string | undefined {
	const responseData = extractObject(extractObject(error, 'response'), 'data');
	const nestedError = extractObject(responseData, 'error');

	return (
		extractString(nestedError, 'message') ??
		extractString(responseData, 'message') ??
		extractString(responseData, 'detail') ??
		extractString(responseData, 'error_description') ??
		extractString(responseData, 'description') ??
		extractString(error, 'message')
	);
}

function extractRequestId(error: unknown): string | undefined {
	const contextualRequestId = extractString(extractObject(error, 'context'), 'requestId');

	if (contextualRequestId !== undefined) {
		return contextualRequestId;
	}

	const headers =
		extractObject(extractObject(error, 'response'), 'headers') ?? extractObject(error, 'headers');

	if (headers === undefined) {
		return undefined;
	}

	for (const headerName of REQUEST_ID_HEADER_NAMES) {
		const headerValue = headers[headerName];

		if (typeof headerValue === 'string' && headerValue.length > 0) {
			return headerValue;
		}

		if (
			Array.isArray(headerValue) &&
			typeof headerValue[0] === 'string' &&
			headerValue[0].length > 0
		) {
			return headerValue[0];
		}
	}

	return undefined;
}

function extractHttpCode(error: unknown): string | undefined {
	if (error instanceof NodeApiError && error.httpCode !== null) {
		return error.httpCode;
	}

	return (
		extractString(error, 'httpCode') ??
		extractString(error, 'statusCode') ??
		extractString(error, 'status') ??
		extractString(error, 'code')
	);
}

function looksLikeHttpError(error: unknown): boolean {
	return (
		extractObject(error, 'response') !== undefined ||
		extractString(error, 'httpCode') !== undefined ||
		extractString(error, 'statusCode') !== undefined ||
		extractString(error, 'status') !== undefined
	);
}

function extractObject(value: unknown, key?: string): Record<string, unknown> | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	if (key === undefined) {
		return value;
	}

	const nested = value[key];

	return isRecord(nested) ? nested : undefined;
}

function extractString(value: unknown, key: string): string | undefined {
	if (!isRecord(value)) {
		return undefined;
	}

	const nested = value[key];

	if (typeof nested === 'string') {
		return nested;
	}

	if (typeof nested === 'number') {
		return String(nested);
	}

	return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
