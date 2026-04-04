export function createRecoverableTimeoutError(requestId: string) {
	return {
		code: 'ETIMEDOUT',
		message: 'socket timed out',
		response: {
			headers: {
				'x-request-id': requestId,
			},
			data: {
				message: 'socket timed out',
			},
		},
	};
}

export function createBoundaryTimeoutError(requestId: string) {
	return {
		code: 'ETIMEDOUT',
		message: 'socket timed out',
		headers: {
			'X-Request-Id': requestId,
		},
	};
}
