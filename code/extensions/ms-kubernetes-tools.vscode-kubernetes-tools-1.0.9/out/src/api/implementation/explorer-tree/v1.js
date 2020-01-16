"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function impl(explorer) {
    return new ExplorerTreeV1Impl(explorer);
}
exports.impl = impl;
class ExplorerTreeV1Impl {
    constructor(explorer) {
        this.explorer = explorer;
    }
    registerNodeContributor(nodeContributor) {
        const adapted = adaptToExplorerExtension(nodeContributor);
        this.explorer.register(adapted);
    }
    refresh() {
        this.explorer.refresh();
    }
}
function adaptToExplorerExtension(nodeContributor) {
    return new NodeContributorAdapter(nodeContributor);
}
class NodeContributorAdapter {
    constructor(impl) {
        this.impl = impl;
    }
    contributesChildren(parent) {
        const parentNode = parent ? adaptKubernetesExplorerNode(parent) : undefined;
        return this.impl.contributesChildren(parentNode);
    }
    getChildren(parent) {
        return __awaiter(this, void 0, void 0, function* () {
            const parentNode = parent ? adaptKubernetesExplorerNode(parent) : undefined;
            const children = yield this.impl.getChildren(parentNode);
            return children.map(objectulise);
        });
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
function objectulise(node) {
    return new Objectulisation(node);
}
class Objectulisation {
    constructor(impl) {
        this.impl = impl;
        this.nodeCategory = 'kubernetes-explorer-node';
        this.nodeType = 'extension';
        this.id = 'dummy';
    }
    getChildren(_kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.impl.getChildren()).map((n) => objectulise(n));
        });
    }
    getTreeItem() {
        return this.impl.getTreeItem();
    }
}
//# sourceMappingURL=v1.js.map