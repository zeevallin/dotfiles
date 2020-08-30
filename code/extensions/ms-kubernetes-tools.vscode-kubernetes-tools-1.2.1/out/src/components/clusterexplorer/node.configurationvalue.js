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
    apiURI(_kubectl, _namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.ConfigurationValueNode = ConfigurationValueNode;
//# sourceMappingURL=node.configurationvalue.js.map