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
const vscode_1 = require("vscode");
class ColumnNode {
    constructor(connection, tablename, column) {
        this.connection = connection;
        this.tablename = tablename;
        this.column = column;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () { return []; });
    }
    getTreeItem() {
        let icon = 'column';
        let label = `${this.column.column_name} : ${this.column.data_type}`;
        let tooltip = label;
        if (this.column.primary_key)
            icon = 'p-key';
        if (this.column.foreign_key) {
            icon = 'f-key';
            tooltip += '\n' + this.column.foreign_key.constraint;
            tooltip += ' -> ' + this.column.foreign_key.table + '.' + this.column.foreign_key.column;
        }
        return {
            label,
            tooltip,
            collapsibleState: vscode_1.TreeItemCollapsibleState.None,
            contextValue: 'vscode-postgres.tree.column',
            iconPath: {
                light: path.join(__dirname, `../../resources/light/${icon}.svg`),
                dark: path.join(__dirname, `../../resources/dark/${icon}.svg`)
            }
        };
    }
}
exports.ColumnNode = ColumnNode;
//# sourceMappingURL=columnNode.js.map