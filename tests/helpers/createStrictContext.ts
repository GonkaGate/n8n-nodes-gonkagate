export function createStrictContext<T extends object>(context: T, label: string): T {
	return new Proxy(context, {
		get(target, property, receiver) {
			if (typeof property === 'symbol' || property in target) {
				return Reflect.get(target, property, receiver);
			}

			// Fail fast when a test reaches an n8n API surface that the harness did not mock.
			throw new Error(`${label} mock does not implement ${String(property)}`);
		},
	});
}
