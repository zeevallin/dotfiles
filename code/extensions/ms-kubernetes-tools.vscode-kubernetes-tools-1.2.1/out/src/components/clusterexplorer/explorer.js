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
const timers_1 = require("timers");
const vscode = require("vscode");
const kubectlUtils = require("../../kubectlUtils");
const sleep_1 = require("../../sleep");
const providerResult = require("../../utils/providerresult");
const explorer_1 = require("../clusterprovider/common/explorer");
const config_1 = require("../config/config");
const watch_1 = require("../kubectl/watch");
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
        history: 'helm.history',
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
        this.refreshQueue = Array();
        host.onDidChangeConfiguration((change) => {
            if (config_1.affectsUs(change)) {
                this.refresh();
            }
        });
    }
    initialize() {
        const viewer = vscode.window.createTreeView('extension.vsKubernetesExplorer', {
            treeDataProvider: this
        });
        return vscode.Disposable.from(viewer, viewer.onDidCollapseElement(this.onElementCollapsed, this), viewer.onDidExpandElement(this.onElementExpanded, this));
    }
    getTreeItem(element) {
        const baseTreeItem = element.getTreeItem();
        const extensionAwareTreeItem = providerResult.transform(baseTreeItem, (ti) => {
            if ('kind' in element && 'apiName' in element.kind && element.kind.apiName) {
                ti.contextValue += 'k8s-watchable';
            }
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
    watch(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.getIdForWatch(node);
            if (!id) {
                console.log('Failed getting id for watch.');
                return;
            }
            const namespace = yield kubectlUtils.currentNamespace(this.kubectl);
            const apiUri = yield node.apiURI(this.kubectl, namespace);
            if (!apiUri) {
                console.log('Api URI is not valid.');
                return;
            }
            const onWatchNotification = (type, _obj) => {
                if (type) {
                    this.queueRefresh(node);
                }
            };
            watch_1.WatchManager.instance().addWatch(id, apiUri, undefined, onWatchNotification);
        });
    }
    stopWatching(node) {
        const id = this.getIdForWatch(node);
        if (id) {
            watch_1.WatchManager.instance().removeWatch(id);
        }
    }
    getChildrenBase(parent) {
        if (parent) {
            return parent.getChildren(this.kubectl, this.host);
        }
        return this.getClusters();
    }
    refresh(node) {
        this.onDidChangeTreeDataEmitter.fire(node);
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
    queueRefresh(node) {
        if (!node) {
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
        else {
            const currentNodeId = this.getIdForWatch(node);
            if (!currentNodeId) {
                return;
            }
            // In the case where many requests of updating are received in a short amount of time
            // the tree is not refreshed for every change but once after a while.
            // Every call resets a timer which trigger the tree refresh
            timers_1.clearTimeout(this.refreshTimer);
            // check if element already is in refreshqueue before pushing it
            const alreadyInQueue = this.refreshQueue.some((queueEntry) => currentNodeId === this.getIdForWatch(queueEntry));
            if (!alreadyInQueue) {
                this.refreshQueue.push(node);
            }
            this.refreshTimer = timers_1.setTimeout(() => {
                this.refreshQueue.splice(0).forEach((n) => this.refresh(n));
            }, 500);
        }
    }
    onElementCollapsed(e) {
        this.collapse(e.element);
    }
    onElementExpanded(e) {
        this.expand(e.element);
    }
    expand(node) {
        const watchId = this.getIdForWatch(node);
        const treeItem = node.getTreeItem();
        providerResult.transform(treeItem, (ti) => {
            if (this.shouldCreateWatch(ti.label, watchId)) {
                this.watch(node);
            }
        });
    }
    collapse(node) {
        const watchId = this.getIdForWatch(node);
        if (watchId && watch_1.WatchManager.instance().existsWatch(watchId)) {
            watch_1.WatchManager.instance().removeWatch(watchId);
        }
    }
    shouldCreateWatch(label, watchId) {
        if (!watchId) {
            return false;
        }
        if (watch_1.WatchManager.instance().existsWatch(watchId)) {
            return true;
        }
        const resourcesToWatch = config_1.getResourcesToBeWatched();
        if (label &&
            resourcesToWatch.length > 0 &&
            resourcesToWatch.indexOf(label) !== -1) {
            return true;
        }
        return false;
    }
    getIdForWatch(node) {
        switch (node.nodeType) {
            case 'folder.resource': {
                return node.kind.abbreviation;
            }
            case 'resource': {
                return node.kindName;
            }
            default: {
                break;
            }
        }
        return undefined;
    }
    getClusters() {
        return __awaiter(this, void 0, void 0, function* () {
            const contexts = yield kubectlUtils.getContexts(this.kubectl, { silent: false }); // TODO: turn it silent, cascade errors, and provide an error node
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