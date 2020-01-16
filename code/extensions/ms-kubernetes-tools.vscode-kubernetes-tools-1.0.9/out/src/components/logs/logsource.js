"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function logSourceOfNode(explorerNode) {
    const queryPath = containersQueryPath(explorerNode);
    if (!queryPath) {
        return undefined;
    }
    return { kindName: explorerNode.resourceId, namespace: explorerNode.namespace || undefined, containersQueryPath: queryPath };
}
exports.logSourceOfNode = logSourceOfNode;
function logSourceOfPod(pod) {
    return {
        kindName: `pod/${pod.name}`,
        namespace: pod.namespace || undefined,
        containers: pod.spec ? pod.spec.containers : undefined,
        containersQueryPath: '.spec'
    };
}
exports.logSourceOfPod = logSourceOfPod;
function containersQueryPath(explorerNode) {
    const kind = explorerNode.resourceId.substring(0, explorerNode.resourceId.indexOf('/'));
    switch (kind) {
        case 'pod': return '.spec';
        case 'job': return '.spec.template.spec';
        default: return undefined;
    }
}
//# sourceMappingURL=logsource.js.map