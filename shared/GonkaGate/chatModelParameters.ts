import type { INodeProperties } from 'n8n-workflow';

import { GONKAGATE_STREAMING_PARAMETER_NAME } from './parameters';

export function createGonkaGateStreamingProperty(): INodeProperties {
	return {
		displayName: 'Enable Streaming',
		name: GONKAGATE_STREAMING_PARAMETER_NAME,
		type: 'boolean',
		default: true,
		description:
			'Whether n8n AI workflows should use GonkaGate SSE streaming on /v1/chat/completions when the surrounding workflow path supports visible live streaming',
	};
}
