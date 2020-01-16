"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const node_1 = require("./node");
class FolderNode extends node_1.ClusterExplorerNodeImpl {
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
exports.FolderNode = FolderNode;
//# sourceMappingURL=node.folder.js.map