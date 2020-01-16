"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const explorer_1 = require("../../../explorer");
const helm_repoExplorer_1 = require("../../../helm.repoExplorer");
function impl() {
    return new CommandTargetsV1Impl();
}
exports.impl = impl;
class CommandTargetsV1Impl {
    resolve(target) {
        if (!target) {
            return undefined;
        }
        if (target.nodeCategory === explorer_1.KUBERNETES_EXPLORER_NODE_CATEGORY) {
            const node = target;
            return {
                targetType: 'kubernetes-explorer-node',
                node: adaptKubernetesExplorerNode(node)
            };
        }
        if (target.nodeCategory === helm_repoExplorer_1.HELM_EXPLORER_NODE_CATEGORY) {
            // const node = target as HelmObject;
            return {
                targetType: 'helm-explorer-node',
            };
        }
        return undefined;
    }
}
function adaptKubernetesExplorerNode(node) {
    switch (node.nodeType) {
        case 'error':
            return { nodeType: 'error' };
        case 'context':
            return { nodeType: 'context', name: node.id };
        case 'folder.grouping':
            return { nodeType: 'folder.grouping' };
        case 'folder.resource':
            return { nodeType: 'folder.resource', resourceKind: node.kind };
        case 'resource':
            return adaptKubernetesExplorerResourceNode(node);
        case 'configitem':
            return { nodeType: 'configitem', name: node.id };
        case 'helm.release':
            return { nodeType: 'helm.release', name: node.id };
        case 'extension':
            return { nodeType: 'extension' };
    }
}
function adaptKubernetesExplorerResourceNode(node) {
    return {
        nodeType: 'resource',
        metadata: node.metadata,
        name: node.id,
        resourceKind: node.kind,
        namespace: node.namespace
    };
}
//# sourceMappingURL=v1.js.map