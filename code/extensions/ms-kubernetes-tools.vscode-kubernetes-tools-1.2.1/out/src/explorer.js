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
const KUBERNETES_CLUSTER = "vsKubernetes.cluster";
const MINIKUBE_CLUSTER = "vsKubernetes.minikubeCluster";
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
    return obj && obj.id && obj.resourceId;
}
exports.isKubernetesExplorerResourceNode = isKubernetesExplorerResourceNode;
class KubernetesExplorer {
    constructor(kubectl, host) {
        this.kubectl = kubectl;
        this.host = host;
        this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        host.onDidChangeConfiguration((change) => {
            if (config_1.affectsUs(change)) {
                this.refresh();
            }
        });
    }
    getTreeItem(element) {
        return element.getTreeItem();
    }
    getChildren(parent) {
        if (parent) {
            return parent.getChildren(this.kubectl, this.host);
        }
        return this.getClusters();
    }
    refresh() {
        this.onDidChangeTreeDataEmitter.fire();
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
/**
 * Dummy object will be displayed as a placeholder in the tree explorer. Cannot be expanded and has no action menus on it.
 * For example, display an "Error" dummy node when failing to get children of expandable parent.
 */
class DummyObject {
    constructor(id, diagnostic) {
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
class KubernetesContextNode {
    constructor(id, metadata) {
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
class KubernetesFolder {
    constructor(id, displayName, contextValue) {
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
        super("workload", "Workloads");
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
        super("config", "Configuration");
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
        super("network", "Network");
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
        super("storage", "Storage");
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
        super(kind.abbreviation, kind.pluralDisplayName, "vsKubernetes.kind");
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
class KubernetesResource {
    constructor(kind, id, metadata) {
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
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super("getTreeItem").call(this);
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
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super("getTreeItem").call(this);
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
        super(kuberesources.allKinds.crd.abbreviation, kuberesources.allKinds.crd.pluralDisplayName);
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
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super("getTreeItem").call(this);
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
        const _super = name => super[name];
        return __awaiter(this, void 0, void 0, function* () {
            const treeItem = yield _super("getTreeItem").call(this);
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
class KubernetesFileObject {
    constructor(configData, id, resource, parentName) {
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
class HelmReleaseResource {
    constructor(name, status) {
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
        super("Helm Release", "Helm Releases", "vsKubernetes.nonResourceFolder");
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
//# sourceMappingURL=explorer.js.map