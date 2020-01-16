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
const path = require("path");
const vscode = require("vscode");
const kubectlUtils = require("./kubectlUtils");
const kuberesources = require("./kuberesources");
const errorable_1 = require("./errorable");
const helmexec = require("./helm.exec");
const kuberesources_virtualfs_1 = require("./kuberesources.virtualfs");
const config_1 = require("./components/config/config");
const providerResult = require("./utils/providerresult");
const sleep_1 = require("./sleep");
const explorer_1 = require("./components/clusterprovider/common/explorer");
const array_1 = require("./utils/array");
const KUBERNETES_CLUSTER = "vsKubernetes.cluster";
const MINIKUBE_CLUSTER = "vsKubernetes.minikubeCluster";
exports.KUBERNETES_EXPLORER_NODE_CATEGORY = 'kubernetes-explorer-node';
function create(kubectl, host) {
    return new KubernetesExplorer(kubectl, host);
}
exports.create = create;
function createKubernetesResourceFolder(kind) {
    return new KubernetesResourceFolder(kind);
}
exports.createKubernetesResourceFolder = createKubernetesResourceFolder;
function createKubernetesResource(kind, id, metadata) {
    return new KubernetesResource(kind, id, metadata);
}
exports.createKubernetesResource = createKubernetesResource;
function getIconForHelmRelease(status) {
    if (status === "deployed") {
        return vscode.Uri.file(path.join(__dirname, "../../images/helmDeployed.svg"));
    }
    else {
        return vscode.Uri.file(path.join(__dirname, "../../images/helmFailed.svg"));
    }
}
function getIconForPodStatus(status) {
    if (status === "running" || status === "completed") {
        return vscode.Uri.file(path.join(__dirname, "../../images/runningPod.svg"));
    }
    else {
        return vscode.Uri.file(path.join(__dirname, "../../images/errorPod.svg"));
    }
}
function isKubernetesExplorerResourceNode(obj) {
    return obj && obj.nodeCategory === exports.KUBERNETES_EXPLORER_NODE_CATEGORY && obj.id && obj.resourceId;
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
        const treeItem = element.getTreeItem();
        // TODO: we need to allow people to distinguish active from inactive cluster nodes,
        // and if someone expands an inactive cluster because it has been extended, they
        // should NOT get all the folder nodes.
        const treeItem2 = providerResult.transform(treeItem, (ti) => {
            if (ti.collapsibleState === vscode.TreeItemCollapsibleState.None && this.extenders.some((e) => e.contributesChildren(element))) {
                ti.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            }
        });
        let treeItem3 = treeItem2;
        for (const c of this.customisers) {
            treeItem3 = providerResult.transformPossiblyAsync(treeItem2, (ti) => c.customize(element, ti));
        }
        return treeItem3;
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
        // In the case where an extender contributes at top level (sibling to cluster nodes),
        // the tree view can populate before the extender has time to register.  So in this
        // case we need to kick off a refresh.  But... it turns out that if we just fire the
        // change event, VS Code goes 'oh well I'm just drawing the thing now so I'll be
        // picking up the change, no need to repopulate a second time.'  Even with a delay
        // there's a race condition.  But it seems that if we pipe it through the refresh
        // *command* (as refreshExplorer does) then it seems to work... ON MY MACHINE TM anyway.
        //
        // This is a pretty niche case, so I'm not too worried if this isn't perfect.
        //
        // TODO: VS Code now doesn't require a reload on extension install.  Do we need
        // to listen for the extension install event and refresh, in case an extension
        // attempts to contribute while the tree view is already open?
        //
        // TODO: we need to check collapsibleStates in case someone adds child nodes to a
        // parent which currently has CollapsibleState.None.
        if (extender.contributesChildren(undefined)) {
            sleep_1.sleep(50).then(() => explorer_1.refreshExplorer());
        }
    }
    registerUICustomiser(customiser) {
        this.customisers.push(customiser);
        sleep_1.sleep(50).then(() => explorer_1.refreshExplorer());
    }
    getClusters() {
        return __awaiter(this, void 0, void 0, function* () {
            const contexts = yield kubectlUtils.getContexts(this.kubectl);
            return contexts.map((context) => {
                // TODO: this is slightly hacky...
                if (context.contextName === 'minikube') {
                    return new MiniKubeContextNode(context.contextName, context);
                }
                return new KubernetesContextNode(context.contextName, context);
            });
        });
    }
}
exports.KubernetesExplorer = KubernetesExplorer;
class KubernetesExplorerNodeImpl {
    constructor(nodeType) {
        this.nodeType = nodeType;
        this.nodeCategory = exports.KUBERNETES_EXPLORER_NODE_CATEGORY;
    }
}
/**
 * Dummy object will be displayed as a placeholder in the tree explorer. Cannot be expanded and has no action menus on it.
 * For example, display an "Error" dummy node when failing to get children of expandable parent.
 */
class DummyObject extends KubernetesExplorerNodeImpl {
    constructor(id, diagnostic) {
        super('error');
        this.id = id;
        this.diagnostic = diagnostic;
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.id, vscode.TreeItemCollapsibleState.None);
        if (this.diagnostic) {
            treeItem.tooltip = this.diagnostic;
        }
        return treeItem;
    }
    getChildren(_kubectl, _host) {
        return [];
    }
}
class KubernetesContextNode extends KubernetesExplorerNodeImpl {
    constructor(id, metadata) {
        super('context');
        this.id = id;
        this.metadata = metadata;
    }
    get icon() {
        return vscode.Uri.file(path.join(__dirname, "../../images/k8s-logo.png"));
    }
    get clusterType() {
        return KUBERNETES_CLUSTER;
    }
    getChildren(_kubectl, _host) {
        if (this.metadata.active) {
            return [
                new KubernetesNamespaceFolder(),
                new KubernetesNodeFolder(),
                new KubernetesWorkloadFolder(),
                new KubernetesNetworkFolder(),
                new KubernetesStorageFolder(),
                new KubernetesConfigFolder(),
                new KubernetesCRDFolder(),
                new HelmReleasesFolder(),
            ];
        }
        return [];
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.id, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.contextValue = this.clusterType;
        treeItem.iconPath = this.icon;
        if (!this.metadata || !this.metadata.active) {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
            treeItem.contextValue += ".inactive";
        }
        if (this.metadata) {
            treeItem.tooltip = `${this.metadata.contextName}\nCluster: ${this.metadata.clusterName}`;
        }
        return treeItem;
    }
}
class MiniKubeContextNode extends KubernetesContextNode {
    get icon() {
        return vscode.Uri.file(path.join(__dirname, "../../images/minikube-logo.png"));
    }
    get clusterType() {
        return MINIKUBE_CLUSTER;
    }
}
class KubernetesFolder extends KubernetesExplorerNodeImpl {
    constructor(nodeType, id, displayName, contextValue) {
        super(nodeType);
        this.nodeType = nodeType;
        this.id = id;
        this.displayName = displayName;
        this.contextValue = contextValue;
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.displayName, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.contextValue = this.contextValue || `vsKubernetes.${this.id}`;
        return treeItem;
    }
}
class KubernetesWorkloadFolder extends KubernetesFolder {
    constructor() {
        super("folder.grouping", "workload", "Workloads");
    }
    getChildren(_kubectl, _host) {
        return [
            new KubernetesSelectsPodsFolder(kuberesources.allKinds.deployment),
            new KubernetesSelectsPodsFolder(kuberesources.allKinds.statefulSet),
            new KubernetesSelectsPodsFolder(kuberesources.allKinds.daemonSet),
            new KubernetesResourceFolder(kuberesources.allKinds.job),
            new KubernetesResourceFolder(kuberesources.allKinds.cronjob),
            new KubernetesResourceFolder(kuberesources.allKinds.pod),
        ];
    }
}
class KubernetesConfigFolder extends KubernetesFolder {
    constructor() {
        super("folder.grouping", "config", "Configuration");
    }
    getChildren(_kubectl, _host) {
        return [
            new KubernetesDataHolderFolder(kuberesources.allKinds.configMap),
            new KubernetesDataHolderFolder(kuberesources.allKinds.secret)
        ];
    }
}
class KubernetesNetworkFolder extends KubernetesFolder {
    constructor() {
        super("folder.grouping", "network", "Network");
    }
    getChildren(_kubectl, _host) {
        return [
            new KubernetesSelectsPodsFolder(kuberesources.allKinds.service),
            new KubernetesResourceFolder(kuberesources.allKinds.endpoint),
            new KubernetesResourceFolder(kuberesources.allKinds.ingress),
        ];
    }
}
class KubernetesStorageFolder extends KubernetesFolder {
    constructor() {
        super("folder.grouping", "storage", "Storage");
    }
    getChildren(_kubectl, _host) {
        return [
            new KubernetesResourceFolder(kuberesources.allKinds.persistentVolume),
            new KubernetesResourceFolder(kuberesources.allKinds.persistentVolumeClaim),
            new KubernetesResourceFolder(kuberesources.allKinds.storageClass),
        ];
    }
}
class KubernetesResourceFolder extends KubernetesFolder {
    constructor(kind) {
        super("folder.resource", kind.abbreviation, kind.pluralDisplayName, "vsKubernetes.kind");
        this.kind = kind;
    }
    getChildren(kubectl, host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.kind === kuberesources.allKinds.pod) {
                const pods = yield kubectlUtils.getPods(kubectl, null, null);
                return pods.map((pod) => {
                    return new KubernetesResource(this.kind, pod.name, pod);
                });
            }
            const childrenLines = yield kubectl.asLines(`get ${this.kind.abbreviation}`);
            if (errorable_1.failed(childrenLines)) {
                host.showErrorMessage(childrenLines.error[0]);
                return [new DummyObject("Error")];
            }
            return childrenLines.result.map((line) => {
                const bits = line.split(' ');
                return new KubernetesResource(this.kind, bits[0]);
            });
        });
    }
}
class KubernetesResource extends KubernetesExplorerNodeImpl {
    constructor(kind, id, metadata) {
        super("resource");
        this.kind = kind;
        this.id = id;
        this.metadata = metadata;
        this.resourceId = `${kind.abbreviation}/${id}`;
    }
    get namespace() {
        return (this.metadata && this.metadata.namespace) ? this.metadata.namespace : null;
    }
    uri(outputFormat) {
        return kuberesources_virtualfs_1.kubefsUri(this.namespace, this.resourceId, outputFormat);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.kind !== kuberesources.allKinds.pod) {
                return [];
            }
            const result = yield kubectl.asJson(`get pods ${this.metadata.name} -o json`);
            if (result.succeeded) {
                const pod = result.result;
                let ready = 0;
                pod.status.containerStatuses.forEach((status) => {
                    if (status.ready) {
                        ready++;
                    }
                });
                return [
                    new DummyObject(`${pod.status.phase} (${ready}/${pod.status.containerStatuses.length})`),
                    new DummyObject(pod.status.podIP),
                ];
            }
            else {
                return [new DummyObject("Error", result.error[0])];
            }
        });
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.id, vscode.TreeItemCollapsibleState.None);
        treeItem.command = {
            command: "extension.vsKubernetesLoad",
            title: "Load",
            arguments: [this]
        };
        treeItem.contextValue = `vsKubernetes.resource.${this.kind.abbreviation}`;
        if (this.namespace) {
            treeItem.tooltip = `Namespace: ${this.namespace}`; // TODO: show only if in non-current namespace?
        }
        if (this.kind === kuberesources.allKinds.pod) {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            if (this.metadata && this.metadata.status) {
                treeItem.iconPath = getIconForPodStatus(this.metadata.status.toLowerCase());
            }
        }
        return treeItem;
    }
}
class KubernetesNodeFolder extends KubernetesResourceFolder {
    constructor() {
        super(kuberesources.allKinds.node);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = yield kubectlUtils.getGlobalResources(kubectl, 'nodes');
            return nodes.map((node) => new KubernetesNodeResource(node.metadata.name, node));
        });
    }
}
class KubernetesNodeResource extends KubernetesResource {
    constructor(name, meta) {
        super(kuberesources.allKinds.node, name, meta);
    }
    getTreeItem() {
        const _super = Object.create(null, {
            getTreeItem: { get: () => super.getTreeItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super.getTreeItem.call(this);
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            return treeItem;
        });
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const pods = yield kubectlUtils.getPods(kubectl, null, 'all');
            const filteredPods = pods.filter((p) => `node/${p.nodeName}` === this.resourceId);
            return filteredPods.map((p) => new KubernetesResource(kuberesources.allKinds.pod, p.name, p));
        });
    }
}
class KubernetesNamespaceFolder extends KubernetesResourceFolder {
    constructor() {
        super(kuberesources.allKinds.namespace);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const namespaces = yield kubectlUtils.getNamespaces(kubectl);
            return namespaces.map((ns) => new KubernetesNamespaceResource(this.kind, ns.name, ns));
        });
    }
}
class KubernetesNamespaceResource extends KubernetesResource {
    constructor(kind, id, metadata) {
        super(kind, id, metadata);
        this.kind = kind;
        this.id = id;
        this.metadata = metadata;
    }
    getTreeItem() {
        const _super = Object.create(null, {
            getTreeItem: { get: () => super.getTreeItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super.getTreeItem.call(this);
            treeItem.contextValue = `vsKubernetes.resource.${this.kind.abbreviation}`;
            if (this.metadata.active) {
                treeItem.label = "* " + treeItem.label;
            }
            else {
                treeItem.contextValue += ".inactive";
            }
            return treeItem;
        });
    }
}
class KubernetesSelectsPodsFolder extends KubernetesResourceFolder {
    constructor(kind) {
        super(kind);
        this.kind = kind;
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const objects = yield kubectlUtils.getResourceWithSelector(this.kind.abbreviation, kubectl);
            return objects.map((obj) => new KubernetesSelectorResource(this.kind, obj.name, obj, obj.selector));
        });
    }
}
class KubernetesCRDFolder extends KubernetesFolder {
    constructor() {
        super("folder.grouping", kuberesources.allKinds.crd.abbreviation, kuberesources.allKinds.crd.pluralDisplayName);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const objects = yield kubectlUtils.getCRDTypes(kubectl);
            return objects.map((obj) => new KubernetesResourceFolder(this.customResourceKind(obj)));
        });
    }
    customResourceKind(crd) {
        return new kuberesources.ResourceKind(crd.spec.names.singular, crd.spec.names.plural, crd.spec.names.kind, this.safeAbbreviation(crd));
    }
    safeAbbreviation(crd) {
        const shortNames = crd.spec.names.shortNames;
        return (shortNames && shortNames.length > 0) ? shortNames[0] : crd.metadata.name;
    }
}
class KubernetesSelectorResource extends KubernetesResource {
    constructor(kind, id, metadata, labelSelector) {
        super(kind, id, metadata);
        this.kind = kind;
        this.id = id;
        this.metadata = metadata;
        this.labelSelector = labelSelector;
        this.selector = labelSelector;
    }
    getTreeItem() {
        const _super = Object.create(null, {
            getTreeItem: { get: () => super.getTreeItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super.getTreeItem.call(this);
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            return treeItem;
        });
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.selector) {
                return [];
            }
            const pods = yield kubectlUtils.getPods(kubectl, this.selector);
            return pods.map((p) => new KubernetesResource(kuberesources.allKinds.pod, p.name, p));
        });
    }
}
class KubernetesDataHolderFolder extends KubernetesResourceFolder {
    constructor(kind) {
        super(kind);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const namespaces = yield kubectlUtils.getDataHolders(this.kind.abbreviation, kubectl);
            return namespaces.map((cm) => new KubernetesDataHolderResource(this.kind, cm.metadata.name, cm, cm.data));
        });
    }
}
class KubernetesDataHolderResource extends KubernetesResource {
    constructor(kind, id, metadata, data) {
        super(kind, id, metadata);
        this.kind = kind;
        this.id = id;
        this.metadata = metadata;
        this.data = data;
        this.configData = data;
        this.resource = this.kind.abbreviation;
    }
    getTreeItem() {
        const _super = Object.create(null, {
            getTreeItem: { get: () => super.getTreeItem }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super.getTreeItem.call(this);
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            return treeItem;
        });
    }
    getChildren(_kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.configData || this.configData.length === 0) {
                return [];
            }
            const files = Object.keys(this.configData);
            return files.map((f) => new KubernetesFileObject(this.configData, f, this.resource, this.id));
        });
    }
}
exports.KubernetesDataHolderResource = KubernetesDataHolderResource;
class KubernetesFileObject extends KubernetesExplorerNodeImpl {
    constructor(configData, id, resource, parentName) {
        super("configitem");
        this.configData = configData;
        this.id = id;
        this.resource = resource;
        this.parentName = parentName;
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.id, vscode.TreeItemCollapsibleState.None);
        treeItem.command = {
            command: "extension.vsKubernetesLoadConfigMapData",
            title: "Load",
            arguments: [this]
        };
        treeItem.contextValue = `vsKubernetes.file`;
        return treeItem;
    }
    getChildren(_kubectl, _host) {
        return [];
    }
}
exports.KubernetesFileObject = KubernetesFileObject;
class HelmReleaseResource extends KubernetesExplorerNodeImpl {
    constructor(name, status) {
        super("helm.release");
        this.name = name;
        this.status = status;
        this.id = "helmrelease:" + name;
    }
    getChildren(_kubectl, _host) {
        return [];
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.name, vscode.TreeItemCollapsibleState.None);
        treeItem.command = {
            command: "extension.helmGet",
            title: "Get",
            arguments: [this]
        };
        treeItem.contextValue = "vsKubernetes.helmRelease";
        treeItem.iconPath = getIconForHelmRelease(this.status.toLowerCase());
        return treeItem;
    }
}
class HelmReleasesFolder extends KubernetesFolder {
    constructor() {
        super("folder.grouping", "Helm Release", "Helm Releases", "vsKubernetes.nonResourceFolder"); // TODO: folder.grouping is not quite right... but...
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!helmexec.ensureHelm(helmexec.EnsureMode.Silent)) {
                return [new DummyObject("Helm client is not installed")];
            }
            const currentNS = yield kubectlUtils.currentNamespace(kubectl);
            const releases = yield helmexec.helmListAll(currentNS);
            if (errorable_1.failed(releases)) {
                return [new DummyObject("Helm list error", releases.error[0])];
            }
            return releases.result.map((r) => new HelmReleaseResource(r.name, r.status));
        });
    }
}
class NodeSourceImpl {
    at(parent) {
        return new ContributedNodeSourceExtender(parent, this);
    }
    if(condition) {
        return new ConditionalNodeSource(this, condition);
    }
}
exports.NodeSourceImpl = NodeSourceImpl;
class CustomResourceFolderNodeSource extends NodeSourceImpl {
    constructor(resourceKind) {
        super();
        this.resourceKind = resourceKind;
    }
    nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            return [new KubernetesResourceFolder(this.resourceKind)];
        });
    }
}
exports.CustomResourceFolderNodeSource = CustomResourceFolderNodeSource;
class CustomGroupingFolderNodeSource extends NodeSourceImpl {
    constructor(displayName, contextValue, children) {
        super();
        this.displayName = displayName;
        this.contextValue = contextValue;
        this.children = children;
    }
    nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            return [new CustomGroupingFolder(this.displayName, this.contextValue, this.children)];
        });
    }
}
exports.CustomGroupingFolderNodeSource = CustomGroupingFolderNodeSource;
class ConditionalNodeSource extends NodeSourceImpl {
    constructor(impl, condition) {
        super();
        this.impl = impl;
        this.condition = condition;
    }
    nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.condition()) {
                return this.impl.nodes();
            }
            return [];
        });
    }
}
class ContributedNodeSourceExtender {
    constructor(under, nodeSource) {
        this.under = under;
        this.nodeSource = nodeSource;
    }
    contributesChildren(parent) {
        if (!parent) {
            return false;
        }
        if (this.under) {
            return parent.nodeType === 'folder.grouping' && parent.displayName === this.under;
        }
        return parent.nodeType === 'context' && parent.metadata.active;
    }
    getChildren(_parent) {
        return this.nodeSource.nodes();
    }
}
exports.ContributedNodeSourceExtender = ContributedNodeSourceExtender;
class CustomGroupingFolder extends KubernetesFolder {
    constructor(displayName, contextValue, children) {
        super('folder.grouping', 'folder.grouping.custom', displayName, contextValue);
        this.children = children;
    }
    getChildren(_kubectl, _host) {
        return this.getChildrenImpl();
    }
    getChildrenImpl() {
        return __awaiter(this, void 0, void 0, function* () {
            const allNodesPromise = Promise.all(this.children.map((c) => c.nodes()));
            const nodeArrays = yield allNodesPromise;
            const nodes = array_1.flatten(...nodeArrays);
            return nodes;
        });
    }
}
//# sourceMappingURL=explorer.js.map