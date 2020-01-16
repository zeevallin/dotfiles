"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ContainerContainer;
(function (ContainerContainer) {
    function fromNode(explorerNode) {
        const queryPath = containersQueryPath(explorerNode);
        if (!queryPath) {
            return undefined;
        }
        return { kindName: explorerNode.kindName, namespace: explorerNode.namespace || undefined, containersQueryPath: queryPath };
    }
    ContainerContainer.fromNode = fromNode;
    function fromPod(pod) {
        return {
            kindName: `pod/${pod.name}`,
            namespace: pod.namespace || undefined,
            containers: pod.spec ? pod.spec.containers : undefined,
            containersQueryPath: '.spec'
        };
    }
    ContainerContainer.fromPod = fromPod;
    function containersQueryPath(explorerNode) {
        const kind = explorerNode.kind.abbreviation;
        switch (kind) {
            case 'pod': return '.spec';
            case 'job': return '.spec.template.spec';
            default: return undefined;
        }
    }
})(ContainerContainer = exports.ContainerContainer || (exports.ContainerContainer = {}));
//# sourceMappingURL=containercontainer.js.map