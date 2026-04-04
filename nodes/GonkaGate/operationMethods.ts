import {
	getGonkaGateOperationDefinitions,
	type GonkaGateNodeMethods,
} from './operationDefinitions';

const GONKAGATE_NODE_METHOD_NAMESPACES_TO_MERGE = [
	'loadOptions',
	'listSearch',
	'credentialTest',
	'resourceMapping',
	'localResourceMapping',
	'actionHandler',
] as const satisfies ReadonlyArray<keyof GonkaGateNodeMethods>;

export function getGonkaGateOperationMethods(): GonkaGateNodeMethods | undefined {
	const mergedMethods: GonkaGateNodeMethods = {};

	for (const operationDefinition of getGonkaGateOperationDefinitions()) {
		if (operationDefinition.methods === undefined) {
			continue;
		}

		mergeGonkaGateOperationMethods(mergedMethods, operationDefinition.methods);
	}

	return hasNodeMethods(mergedMethods) ? mergedMethods : undefined;
}

function mergeGonkaGateOperationMethods(
	mergedMethods: GonkaGateNodeMethods,
	methodsToMerge: GonkaGateNodeMethods,
): void {
	// n8n method namespaces are nested objects, so they need field-wise merging.
	for (const namespace of GONKAGATE_NODE_METHOD_NAMESPACES_TO_MERGE) {
		mergeNodeMethodNamespace(mergedMethods, namespace, methodsToMerge[namespace]);
	}
}

function mergeNodeMethodNamespace<K extends keyof GonkaGateNodeMethods>(
	methods: GonkaGateNodeMethods,
	namespace: K,
	values: GonkaGateNodeMethods[K] | undefined,
): void {
	if (values === undefined) {
		return;
	}

	methods[namespace] = {
		...(methods[namespace] ?? {}),
		...values,
	} as GonkaGateNodeMethods[K];
}

function hasNodeMethods(methods: GonkaGateNodeMethods): boolean {
	return Object.values(methods).some(
		(value) => value !== undefined && Object.keys(value).length > 0,
	);
}
