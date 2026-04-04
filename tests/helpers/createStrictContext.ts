export function createStrictContext<TExpected extends object, TContext extends object = TExpected>(
	context: TContext,
	contextName: string,
): TExpected {
	const proxy: object = new Proxy(context, {
		get(target, property, receiver) {
			if (typeof property === 'symbol' || property in target) {
				return Reflect.get(target, property, receiver);
			}

			// Fail fast when a test reaches an n8n API surface that the mock did not define.
			throw new Error(`${contextName} mock does not implement ${String(property)}`);
		},
	});

	return proxy as TExpected;
}
