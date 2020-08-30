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
const path = require("path");
const kuberesources = require("../../kuberesources");
const node_1 = require("./node");
const node_folder_helmreleases_1 = require("./node.folder.helmreleases");
const node_folder_crdtypes_1 = require("./node.folder.crdtypes");
const node_folder_grouping_1 = require("./node.folder.grouping");
const node_folder_resource_1 = require("./node.folder.resource");
const explorer_1 = require("./explorer");
const KUBERNETES_CLUSTER = "vsKubernetes.cluster";
const MINIKUBE_CLUSTER = "vsKubernetes.minikubeCluster";
class ContextNode extends node_1.ClusterExplorerNodeImpl {
    constructor(contextName, kubectlContext) {
        super(explorer_1.NODE_TYPES.context);
        this.contextName = contextName;
        this.kubectlContext = kubectlContext;
        this.nodeType = explorer_1.NODE_TYPES.context;
    }
    get icon() {
        return vscode.Uri.file(path.join(__dirname, "../../../../images/k8s-logo.png"));
    }
    get clusterType() {
        return KUBERNETES_CLUSTER;
    }
    getChildren(_kubectl, _host) {
        if (this.kubectlContext.active) {
            return [
                node_folder_resource_1.ResourceFolderNode.create(kuberesources.allKinds.namespace),
                node_folder_resource_1.ResourceFolderNode.create(kuberesources.allKinds.node),
                node_folder_grouping_1.workloadsGroupingFolder(),
                node_folder_grouping_1.networkGroupingFolder(),
                node_folder_grouping_1.storageGroupingFolder(),
                node_folder_grouping_1.configurationGroupingFolder(),
                new node_folder_crdtypes_1.CRDTypesFolderNode(),
                new node_folder_helmreleases_1.HelmReleasesFolder(),
            ];
        }
        return [];
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.contextName, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.contextValue = this.clusterType;
        treeItem.iconPath = this.icon;
        if (!this.kubectlContext || !this.kubectlContext.active) {
            treeItem.collapsibleState = vscode.TreeItemCollapsibleState.None;
            treeItem.contextValue += ".inactive";
        }
        if (this.kubectlContext) {
            treeItem.tooltip = `${this.kubectlContext.contextName}\nCluster: ${this.kubectlContext.clusterName}`;
        }
        return treeItem;
    }
    apiURI(_kubectl, _namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.ContextNode = ContextNode;
class MiniKubeContextNode extends ContextNode {
    get icon() {
        return vscode.Uri.file(path.join(__dirname, "../../../../images/minikube-logo.png"));
    }
    get clusterType() {
        return MINIKUBE_CLUSTER;
    }
}
exports.MiniKubeContextNode = MiniKubeContextNode;
//# sourceMappingURL=node.context.js.map