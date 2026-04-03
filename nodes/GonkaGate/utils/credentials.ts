import {
	GONKAGATE_BASE_URL_MIGRATION_MESSAGE,
	LEGACY_GONKAGATE_BASE_URL_PLACEHOLDER,
} from '../constants';

export function resolveGonkaGateBaseUrl(rawUrl: unknown): string {
	const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';

	if (url.length === 0 || url === LEGACY_GONKAGATE_BASE_URL_PLACEHOLDER) {
		throw new Error(GONKAGATE_BASE_URL_MIGRATION_MESSAGE);
	}

	return url;
}
