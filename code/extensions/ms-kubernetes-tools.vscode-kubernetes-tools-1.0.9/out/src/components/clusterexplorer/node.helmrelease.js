"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const node_1 = require("./node");
const explorer_1 = require("./explorer");
class HelmReleaseNode extends node_1.ClusterExplorerNodeImpl {
    constructor(releaseName, status) {
        super(explorer_1.NODE_TYPES.helm.release);
        this.releaseName = releaseName;
        this.status = status;
        this.nodeType = explorer_1.NODE_TYPES.helm.release;
    }
    getChildren(_kubectl, _host) {
        return [];
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.releaseName, vscode.TreeItemCollapsibleState.None);
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
exports.HelmReleaseNode = HelmReleaseNode;
function getIconForHelmRelease(status) {
    if (status === "deployed") {
        return vscode.Uri.file(path.join(__dirname, "../../../../images/helmDeployed.svg"));
    }
    else {
        return vscode.Uri.file(path.join(__dirname, "../../../../images/helmFailed.svg"));
    }
}
//# sourceMappingURL=node.helmrelease.js.map