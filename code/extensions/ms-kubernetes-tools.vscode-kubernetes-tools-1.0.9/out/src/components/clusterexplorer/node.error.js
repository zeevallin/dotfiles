"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const node_1 = require("./node");
/**
 * Dummy object will be displayed as a placeholder in the tree explorer. Cannot be expanded and has no action menus on it.
 * For example, display an "Error" dummy node when failing to get children of expandable parent.
 */
class ErrorNode extends node_1.ClusterExplorerNodeImpl {
    constructor(id, diagnostic) {
        super('error');
        this.id = id;
        this.diagnostic = diagnostic;
        this.nodeType = 'error';
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
exports.ErrorNode = ErrorNode;
//# sourceMappingURL=node.error.js.map