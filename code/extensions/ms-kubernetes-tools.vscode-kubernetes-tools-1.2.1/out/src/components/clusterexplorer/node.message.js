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
const explorer_1 = require("./explorer");
/**
 * Dummy object will be displayed as a placeholder in the tree explorer. Cannot be expanded and has no action menus on it.
 * For example, display an "Error" dummy node when failing to get children of expandable parent.
 */
class MessageNode extends node_1.ClusterExplorerNodeImpl {
    constructor(text, diagnostic) {
        super(explorer_1.NODE_TYPES.error);
        this.text = text;
        this.diagnostic = diagnostic;
        this.nodeType = explorer_1.NODE_TYPES.error;
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.text, vscode.TreeItemCollapsibleState.None);
        if (this.diagnostic) {
            treeItem.tooltip = this.diagnostic;
        }
        return treeItem;
    }
    getChildren(_kubectl, _host) {
        return [];
    }
    apiURI(_kubectl, _namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.MessageNode = MessageNode;
//# sourceMappingURL=node.message.js.map