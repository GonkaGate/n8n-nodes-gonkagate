import type { IDataObject, INode, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

type GonkaGateErrorContext = {
	itemIndex?: number;
	requestId?: string;
	recoverable?: boolean;
};

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

const REQUEST_ID_HEADER_NAMES = [
	'x-request-id',
	'request-id',
	'x-gonkagate-request-id',
	'x-correlation-id',
];

const gonkaGateErrorContextByError = new WeakMap<
	NodeApiError | NodeOperationError,
	GonkaGateErrorContext
>();

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
			recoverable: inferRecoverableNodeError(error),
		});
		return error;
	}

	const requestId = extractRequestId(error);
	const description = buildErrorDescription(error, requestId);
	const primaryMessage = extractPrimaryMessage(error);
	const errorCode = extractString(error, 'code');

	if (errorCode && NETWORK_ERROR_MESSAGES[errorCode] !== undefined) {
		return attachErrorContext(
			createRecoverableNodeOperationError(
				node,
				toErrorInstance(error, primaryMessage),
				itemIndex,
				NETWORK_ERROR_MESSAGES[errorCode],
				description,
			),
			itemIndex,
			{
				requestId,
				recoverable: true,
			},
		);
	}

	if (looksLikeHttpError(error)) {
		return attachErrorContext(
			createRecoverableNodeApiError(node, toJsonObject(error), itemIndex, description),
			itemIndex,
			{
				requestId,
				recoverable: true,
			},
		);
	}

	return attachErrorContext(
		createFallbackNodeOperationError(
			node,
			toErrorInstance(error, primaryMessage ?? `GonkaGate ${operationName} failed`),
			itemIndex,
			primaryMessage ?? `GonkaGate ${operationName} failed`,
			description,
		),
		itemIndex,
		{
			requestId,
			recoverable: false,
		},
	);
}

export async function runWithNormalizedGonkaGateError<T>(input: {
	node: INode;
	itemIndex: number;
	operationName: string;
	run(): Promise<T>;
}): Promise<T> {
	try {
		return await input.run();
	} catch (error) {
		throw normalizeGonkaGateError(input.node, error, input.itemIndex, input.operationName);
	}
}

export function toGonkaGateNodeOperationError(
	node: INode,
	error: unknown,
	itemIndex: number,
): NodeOperationError {
	if (error instanceof NodeOperationError) {
		return error;
	}

	return new NodeOperationError(node, toErrorInstance(error), {
		itemIndex,
	});
}

export function serializeGonkaGateError(error: unknown): IDataObject {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		return serializeKnownGonkaGateError(error);
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
		return getErrorContext(error)?.recoverable === true;
	}

	const errorCode = extractString(error, 'code');

	return (
		(errorCode !== undefined && NETWORK_ERROR_MESSAGES[errorCode] !== undefined) ||
		looksLikeHttpError(error)
	);
}

function inferRecoverableNodeError(error: NodeApiError | NodeOperationError): boolean | undefined {
	const contextualRecoverable = getErrorContext(error)?.recoverable;

	if (contextualRecoverable !== undefined) {
		return contextualRecoverable;
	}

	if (error instanceof NodeApiError) {
		const httpCode = Number(error.httpCode);

		return Number.isFinite(httpCode) && (httpCode === 408 || httpCode === 429 || httpCode >= 500);
	}

	return Object.values(NETWORK_ERROR_MESSAGES).some(
		(networkErrorMessage) => networkErrorMessage === error.message,
	);
}

function createRecoverableNodeOperationError(
	node: INode,
	error: Error,
	itemIndex: number,
	message: string,
	description?: string,
): NodeOperationError {
	return new NodeOperationError(node, error, {
		itemIndex,
		message,
		description,
	});
}

function createRecoverableNodeApiError(
	node: INode,
	error: JsonObject,
	itemIndex: number,
	description?: string,
): NodeApiError {
	return new NodeApiError(node, error, {
		itemIndex,
		description,
	});
}

function createFallbackNodeOperationError(
	node: INode,
	error: Error,
	itemIndex: number,
	message: string,
	description?: string,
): NodeOperationError {
	return new NodeOperationError(node, error, {
		itemIndex,
		message,
		description,
	});
}

function serializeKnownGonkaGateError(error: NodeApiError | NodeOperationError): IDataObject {
	const output: IDataObject = {
		error: error.message,
	};

	if (typeof error.description === 'string' && error.description.length > 0) {
		output.description = error.description;
	}

	if (error instanceof NodeApiError && error.httpCode !== null) {
		output.httpCode = error.httpCode;
	}

	const requestId = getErrorContext(error)?.requestId ?? extractRequestId(error);

	if (typeof requestId === 'string' && requestId.length > 0) {
		output.requestId = requestId;
	}

	return output;
}

function attachErrorContext<T extends NodeApiError | NodeOperationError>(
	error: T,
	itemIndex: number,
	context: {
		requestId?: string;
		recoverable?: boolean;
	},
): T {
	const currentContext = getErrorContext(error) ?? {};

	gonkaGateErrorContextByError.set(error, {
		itemIndex: currentContext.itemIndex ?? itemIndex,
		requestId:
			currentContext.requestId ??
			(context.requestId !== undefined && context.requestId.length > 0
				? context.requestId
				: undefined),
		recoverable: currentContext.recoverable ?? context.recoverable,
	});

	return error;
}

function getErrorContext(
	error: NodeApiError | NodeOperationError,
): GonkaGateErrorContext | undefined {
	return gonkaGateErrorContextByError.get(error);
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
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		const contextualRequestId = getErrorContext(error)?.requestId;

		if (contextualRequestId !== undefined) {
			return contextualRequestId;
		}
	}

	const headers =
		extractObject(extractObject(error, 'response'), 'headers') ?? extractObject(error, 'headers');

	if (headers === undefined) {
		return undefined;
	}

	for (const headerName of REQUEST_ID_HEADER_NAMES) {
		const headerValue = getHeaderValue(headers, headerName);

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

function getHeaderValue(
	headers: Record<string, unknown>,
	headerName: string,
): string | string[] | undefined {
	const normalizedHeaderName = headerName.toLowerCase();

	for (const [key, value] of Object.entries(headers)) {
		if (key.toLowerCase() !== normalizedHeaderName) {
			continue;
		}

		if (typeof value === 'string') {
			return value;
		}

		if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
			return value;
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

function toErrorInstance(error: unknown, fallbackMessage = 'Unknown error'): Error {
	if (error instanceof Error) {
		return error;
	}

	return new Error(
		extractPrimaryMessage(error) ?? extractString(error, 'message') ?? fallbackMessage,
	);
}

function toJsonObject(value: unknown): JsonObject {
	if (value instanceof Error) {
		return toJsonObjectFromError(value);
	}

	if (!isRecord(value)) {
		return {};
	}

	return toJsonObjectFromRecord(value);
}

function toJsonObjectFromError(error: Error): JsonObject {
	const errorRecord: Record<string, unknown> = {
		name: error.name,
		message: error.message,
	};

	assignIfDefined(errorRecord, 'code', extractString(error, 'code'));
	assignIfDefined(errorRecord, 'description', extractString(error, 'description'));
	assignIfDefined(errorRecord, 'httpCode', extractString(error, 'httpCode'));
	assignIfDefined(errorRecord, 'status', extractString(error, 'status'));
	assignIfDefined(errorRecord, 'statusCode', extractString(error, 'statusCode'));
	assignIfDefined(errorRecord, 'headers', extractObject(error, 'headers'));
	assignIfDefined(errorRecord, 'reason', extractObject(error, 'reason'));
	assignIfDefined(errorRecord, 'response', extractObject(error, 'response'));

	return toJsonObjectFromRecord(errorRecord);
}

function toJsonObjectFromRecord(value: Record<string, unknown>): JsonObject {
	const jsonObject: JsonObject = {};

	for (const [key, nestedValue] of Object.entries(value)) {
		const jsonValue = toJsonValue(nestedValue);

		if (jsonValue !== undefined) {
			jsonObject[key] = jsonValue;
		}
	}

	return jsonObject;
}

function toJsonValue(value: unknown): JsonValue | undefined {
	if (
		value === null ||
		typeof value === 'string' ||
		(typeof value === 'number' && Number.isFinite(value)) ||
		typeof value === 'boolean'
	) {
		return value;
	}

	if (Array.isArray(value)) {
		return value
			.map((item) => toJsonValue(item))
			.filter((item): item is JsonValue => item !== undefined);
	}

	if (isRecord(value)) {
		return toJsonObject(value);
	}

	return undefined;
}

function assignIfDefined(target: Record<string, unknown>, key: string, value: unknown): void {
	if (value !== undefined) {
		target[key] = value;
	}
}
