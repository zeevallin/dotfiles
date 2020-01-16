"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
class InfoNode {
    constructor(label) {
        this.label = label;
    }
    getTreeItem() {
        return {
            label: this.label.toString(),
            collapsibleState: vscode_1.TreeItemCollapsibleState.None,
            contextValue: 'vscode-postgres.tree.error',
            iconPath: {
                light: path.join(__dirname, '../../resources/light/error.svg'),
                dark: path.join(__dirname, '../../resources/dark/error.svg')
            }
        };
    }
    getChildren() { return []; }
}
exports.InfoNode = InfoNode;
//# sourceMappingURL=infoNode.js.map