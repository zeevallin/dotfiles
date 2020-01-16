"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const explorer_1 = require("../../../components/clusterexplorer/explorer");
const extension_nodesources_1 = require("../../../components/clusterexplorer/extension.nodesources");
const kuberesources_1 = require("../../../kuberesources");
function impl(explorer) {
    return new ClusterExplorerV1Impl(explorer);
}
exports.impl = impl;
class ClusterExplorerV1Impl {
    constructor(explorer) {
        this.explorer = explorer;
    }
    resolveCommandTarget(target) {
        if (!target) {
            return undefined;
        }
        if (target.nodeCategory === explorer_1.KUBERNETES_EXPLORER_NODE_CATEGORY) {
            const implNode = target;
            const apiNode = adaptKubernetesExplorerNode(implNode);
            return apiNode;
        }
        return undefined;
    }
    registerNodeContributor(nodeContributor) {
        const adapted = internalNodeContributorOf(nodeContributor);
        this.explorer.registerExtender(adapted);
    }
    registerNodeUICustomizer(nodeUICustomizer) {
        const adapted = adaptToExplorerUICustomizer(nodeUICustomizer);
        this.explorer.registerUICustomiser(adapted);
    }
    get nodeSources() {
        return {
            resourceFolder: resourceFolderContributor,
            groupingFolder: groupingFolderContributor
        };
    }
    refresh() {
        this.explorer.refresh();
    }
}
function adaptToExplorerUICustomizer(nodeUICustomizer) {
    return new NodeUICustomizerAdapter(nodeUICustomizer);
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
            return children.map(internalNodeOf);
        });
    }
}
class NodeUICustomizerAdapter {
    constructor(impl) {
        this.impl = impl;
    }
    customize(element, treeItem) {
        const waiter = this.impl.customize(adaptKubernetesExplorerNode(element), treeItem);
        if (waiter) {
            return waitFor(waiter);
        }
        return true;
    }
}
function waitFor(waiter) {
    return __awaiter(this, void 0, void 0, function* () {
        yield waiter;
        return true;
    });
}
function adaptKubernetesExplorerNode(node) {
    switch (node.nodeType) {
        case 'error':
            return { nodeType: 'error' };
        case 'context':
            return node.kubectlContext.active ?
                { nodeType: 'context', name: node.contextName } :
                { nodeType: 'context.inactive', name: node.contextName };
        case 'folder.grouping':
            return { nodeType: 'folder.grouping' };
        case 'folder.resource':
            return { nodeType: 'folder.resource', resourceKind: node.kind };
        case 'resource':
            return adaptKubernetesExplorerResourceNode(node);
        case 'configitem':
            return { nodeType: 'configitem', name: node.key };
        case 'helm.release':
            return { nodeType: 'helm.release', name: node.releaseName };
        case 'extension':
            return { nodeType: 'extension' };
    }
}
function adaptKubernetesExplorerResourceNode(node) {
    return {
        nodeType: 'resource',
        metadata: node.metadata,
        name: node.name,
        resourceKind: node.kind,
        namespace: node.namespace
    };
}
class ContributedNode {
    constructor(impl) {
        this.impl = impl;
        this.nodeCategory = 'kubernetes-explorer-node';
        this.nodeType = 'extension';
        this.id = 'dummy';
    }
    getChildren(_kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.impl.getChildren()).map((n) => internalNodeOf(n));
        });
    }
    getTreeItem() {
        return this.impl.getTreeItem();
    }
}
exports.ContributedNode = ContributedNode;
function resourceFolderContributor(displayName, pluralDisplayName, manifestKind, abbreviation) {
    const nodeSource = new extension_nodesources_1.CustomResourceFolderNodeSource(new kuberesources_1.ResourceKind(displayName, pluralDisplayName, manifestKind, abbreviation));
    return apiNodeSourceOf(nodeSource);
}
function groupingFolderContributor(displayName, contextValue, ...children) {
    const nodeSource = new extension_nodesources_1.CustomGroupingFolderNodeSource(displayName, contextValue, children.map(internalNodeSourceOf));
    return apiNodeSourceOf(nodeSource);
}
const BUILT_IN_CONTRIBUTOR_KIND_TAG = 'nativeextender-4a4bc473-a8c6-4b1e-973f-22327f99cea8';
const BUILT_IN_NODE_KIND_TAG = 'nativek8sobject-5be3c876-3683-44cd-a400-7763d2c4302a';
const BUILT_IN_NODE_SOURCE_KIND_TAG = 'nativenodesource-aa0c30a9-bf1d-444a-a147-7823edcc7c04';
function apiNodeSourceOf(nodeSet) {
    return {
        at(parent) { const ee = nodeSet.at(parent); return apiNodeContributorOf(ee); },
        if(condition) { return apiNodeSourceOf(nodeSet.if(condition)); },
        nodes() {
            return __awaiter(this, void 0, void 0, function* () { return (yield nodeSet.nodes()).map(apiNodeOf); });
        },
        [BUILT_IN_NODE_SOURCE_KIND_TAG]: true,
        impl: nodeSet
    };
}
function internalNodeSourceOf(nodeSet) {
    if (nodeSet[BUILT_IN_NODE_SOURCE_KIND_TAG]) {
        return nodeSet.impl;
    }
    return {
        at(parent) { return internalNodeContributorOf(nodeSet.at(parent)); },
        if(condition) { return internalNodeSourceOf(nodeSet).if(condition); },
        nodes() {
            return __awaiter(this, void 0, void 0, function* () { return (yield nodeSet.nodes()).map(internalNodeOf); });
        }
    };
}
function internalNodeContributorOf(nodeContributor) {
    if (nodeContributor[BUILT_IN_CONTRIBUTOR_KIND_TAG] === true) {
        return nodeContributor.impl;
    }
    return new NodeContributorAdapter(nodeContributor);
}
function apiNodeContributorOf(ee) {
    return {
        contributesChildren(_parent) { return false; },
        getChildren(_parent) {
            return __awaiter(this, void 0, void 0, function* () { return []; });
        },
        [BUILT_IN_CONTRIBUTOR_KIND_TAG]: true,
        impl: ee
    };
}
function internalNodeOf(node) {
    if (node[BUILT_IN_NODE_KIND_TAG]) {
        return node.impl;
    }
    return new ContributedNode(node);
}
exports.internalNodeOf = internalNodeOf;
function apiNodeOf(node) {
    return {
        getChildren() {
            return __awaiter(this, void 0, void 0, function* () { throw new Error('apiNodeOf->getChildren: not expected to be called directly'); });
        },
        getTreeItem() { throw new Error('apiNodeOf->getTreeItem: not expected to be called directly'); },
        [BUILT_IN_NODE_KIND_TAG]: true,
        impl: node
    };
}
//# sourceMappingURL=v1.js.map