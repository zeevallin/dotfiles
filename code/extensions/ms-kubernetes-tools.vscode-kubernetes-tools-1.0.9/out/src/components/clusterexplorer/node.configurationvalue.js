"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const node_1 = require("./node");
const explorer_1 = require("./explorer");
class ConfigurationValueNode extends node_1.ClusterExplorerNodeImpl {
    constructor(configData, key, parentKind, parentName) {
        super(explorer_1.NODE_TYPES.configitem);
        this.configData = configData;
        this.key = key;
        this.parentKind = parentKind;
        this.parentName = parentName;
        this.nodeType = explorer_1.NODE_TYPES.configitem;
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.key, vscode.TreeItemCollapsibleState.None);
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
exports.ConfigurationValueNode = ConfigurationValueNode;
//# sourceMappingURL=node.configurationvalue.js.map