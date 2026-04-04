export function createStrictContext<T extends object>(context: T, mockName: string): T {
	return new Proxy(context, {
		get(target, property, receiver) {
			if (typeof property === 'symbol' || property in target) {
				return Reflect.get(target, property, receiver);
			}

			// Fail fast when a test reaches an n8n API surface that the mock did not define.
			throw new Error(`${mockName} mock does not implement ${String(property)}`);
		},
	});
}
