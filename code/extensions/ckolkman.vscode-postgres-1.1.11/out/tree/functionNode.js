"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
class FunctionNode {
    constructor(connection, func, args, ret, schema, description) {
        this.connection = connection;
        this.func = func;
        this.args = args;
        this.ret = ret;
        this.schema = schema;
        this.description = description;
    }
    getTreeItem() {
        let label = `${this.func}(${this.args.join(', ')}) : ${this.ret}`;
        let tooltip = label;
        if (this.description != null) {
            tooltip += '\n' + this.description;
        }
        return {
            label: label,
            tooltip: tooltip,
            collapsibleState: vscode_1.TreeItemCollapsibleState.None,
            contextValue: 'vscode-postgres.tree.function',
            iconPath: {
                light: path.join(__dirname, `../../resources/light/function.svg`),
                dark: path.join(__dirname, `../../resources/dark/function.svg`)
            }
        };
    }
    getChildren() {
        return [];
    }
}
exports.FunctionNode = FunctionNode;
//# sourceMappingURL=functionNode.js.map