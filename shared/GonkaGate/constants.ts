export const GONKAGATE_BASE_URL = 'https://api.gonkagate.com/v1';

// The credential default already includes `/v1`, so request helpers must use
// paths relative to that versioned base URL.
export const GONKAGATE_MODELS_PATH = '/models';

export const GONKAGATE_CHAT_COMPLETIONS_PATH = '/chat/completions';

export const LEGACY_GONKAGATE_BASE_URL_PLACEHOLDER = '__GONKAGATE_BASE_URL_UNRESOLVED__';

export const GONKAGATE_BASE_URL_MIGRATION_MESSAGE =
	'This GonkaGate credential was created before the official API base URL default was published. Recreate the credential so it uses https://api.gonkagate.com/v1.';
