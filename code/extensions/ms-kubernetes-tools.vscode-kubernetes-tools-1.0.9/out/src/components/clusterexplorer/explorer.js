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
const vscode = require("vscode");
const kubectlUtils = require("../../kubectlUtils");
const config_1 = require("../config/config");
const providerResult = require("../../utils/providerresult");
const sleep_1 = require("../../sleep");
const explorer_1 = require("../clusterprovider/common/explorer");
const node_context_1 = require("./node.context");
// Each item in the explorer is modelled as a ClusterExplorerNode.  This
// is a discriminated union, using a nodeType field as its discriminator.
// This module defines the discriminators and the union type, and contains
// the top level of the explorer.  Individual modules using the 'node.*.ts'
// naming convention go on to define individual node types; additionally,
// 'node.ts' defines interface types which are intended as the primary way for
// consumers of the explorer to obtain data about nodes.
//
// Most node types are pretty self-contained in terms of their behaviour
// and their display.  The exception is resource nodes which sometimes
// need to gather additional information, display additional children
// and customise their display behaviour.  This is done via 'resource kind
// UI descriptors' in the 'resourceui.ts' file directory.  The ResourceNode
// type is always instantiated via a factory method which automatically loads
// the right descriptor for the resource kind; this allows parents that want
// to display resource children to be agnostic about what information those
// children need in order to render themselves and their own children.
//
// This module also contains the handling for the cross-cutting concern
// of API extensibility.  It implements extender registration, and takes
// care of invoking extenders around the delegated calls to node types.
exports.KUBERNETES_EXPLORER_NODE_CATEGORY = 'kubernetes-explorer-node';
exports.NODE_TYPES = {
    error: 'error',
    context: 'context',
    folder: {
        resource: 'folder.resource',
        grouping: 'folder.grouping',
    },
    resource: 'resource',
    configitem: 'configitem',
    helm: {
        release: 'helm.release',
    },
    extension: 'extension'
};
function create(kubectl, host) {
    return new KubernetesExplorer(kubectl, host);
}
exports.create = create;
function isKubernetesExplorerResourceNode(obj) {
    return obj && obj.nodeCategory === exports.KUBERNETES_EXPLORER_NODE_CATEGORY && obj.nodeType === 'resource';
}
exports.isKubernetesExplorerResourceNode = isKubernetesExplorerResourceNode;
class KubernetesExplorer {
    constructor(kubectl, host) {
        this.kubectl = kubectl;
        this.host = host;
        this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        this.extenders = Array.of();
        this.customisers = Array.of();
        host.onDidChangeConfiguration((change) => {
            if (config_1.affectsUs(change)) {
                this.refresh();
            }
        });
    }
    getTreeItem(element) {
        const baseTreeItem = element.getTreeItem();
        const extensionAwareTreeItem = providerResult.transform(baseTreeItem, (ti) => {
            if (ti.collapsibleState === vscode.TreeItemCollapsibleState.None && this.extenders.some((e) => e.contributesChildren(element))) {
                ti.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            }
        });
        let customisedTreeItem = extensionAwareTreeItem;
        for (const c of this.customisers) {
            customisedTreeItem = providerResult.transformPossiblyAsync(extensionAwareTreeItem, (ti) => c.customize(element, ti));
        }
        return customisedTreeItem;
    }
    getChildren(parent) {
        const baseChildren = this.getChildrenBase(parent);
        const contributedChildren = this.extenders
            .filter((e) => e.contributesChildren(parent))
            .map((e) => e.getChildren(parent));
        return providerResult.append(baseChildren, ...contributedChildren);
    }
    getChildrenBase(parent) {
        if (parent) {
            return parent.getChildren(this.kubectl, this.host);
        }
        return this.getClusters();
    }
    refresh() {
        this.onDidChangeTreeDataEmitter.fire();
    }
    registerExtender(extender) {
        this.extenders.push(extender);
        if (extender.contributesChildren(undefined)) {
            this.queueRefresh();
        }
        // TODO: VS Code now doesn't require a reload on extension install.  Do we need
        // to listen for the extension install event and refresh, in case a newly installed
        // extension registers a contributor while the tree view is already open?
    }
    registerUICustomiser(customiser) {
        this.customisers.push(customiser);
        this.queueRefresh();
    }
    queueRefresh() {
        // In the case where an extender contributes at top level (sibling to cluster nodes),
        // the tree view can populate before the extender has time to register.  So in this
        // case we need to kick off a refresh.  But... it turns out that if we just fire the
        // change event, VS Code goes 'oh well I'm just drawing the thing now so I'll be
        // picking up the change, no need to repopulate a second time.'  Even with a delay
        // there's a race condition.  But it seems that if we pipe it through the refresh
        // *command* (as refreshExplorer does) then it seems to work... ON MY MACHINE TM anyway.
        //
        // Refresh after registration is also a consideration for customisers, but we don't know
        // whether they're  interested in the top level so we have to err on the side of caution
        // and always queue a refresh.
        //
        // These are pretty niche cases, so I'm not too worried if they aren't perfect.
        sleep_1.sleep(50).then(() => explorer_1.refreshExplorer());
    }
    getClusters() {
        return __awaiter(this, void 0, void 0, function* () {
            const contexts = yield kubectlUtils.getContexts(this.kubectl);
            return contexts.map((context) => {
                // TODO: this is slightly hacky...
                if (context.contextName === 'minikube') {
                    return new node_context_1.MiniKubeContextNode(context.contextName, context);
                }
                return new node_context_1.ContextNode(context.contextName, context);
            });
        });
    }
}
exports.KubernetesExplorer = KubernetesExplorer;
//# sourceMappingURL=explorer.js.map