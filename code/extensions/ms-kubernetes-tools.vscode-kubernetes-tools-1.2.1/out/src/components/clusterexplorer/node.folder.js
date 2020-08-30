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
    apiURI(_kubectl, _namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.FolderNode = FolderNode;
//# sourceMappingURL=node.folder.js.map