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
const kuberesources_virtualfs_1 = require("../../kuberesources.virtualfs");
const node_1 = require("./node");
const resourceui_1 = require("./resourceui");
const explorer_1 = require("./explorer");
class ResourceNode extends node_1.ClusterExplorerNodeImpl {
    constructor(kind, name, metadata, extraInfo) {
        super(explorer_1.NODE_TYPES.resource);
        this.kind = kind;
        this.name = name;
        this.metadata = metadata;
        this.extraInfo = extraInfo;
        this.nodeType = explorer_1.NODE_TYPES.resource;
        this.kindName = `${kind.abbreviation}/${name}`;
    }
    static create(kind, name, metadata, extraInfo) {
        return new ResourceNode(kind, name, metadata, extraInfo);
    }
    get namespace() {
        return (this.metadata && this.metadata.namespace) ? this.metadata.namespace : null;
    }
    uri(outputFormat) {
        return kuberesources_virtualfs_1.kubefsUri(this.namespace, this.kindName, outputFormat);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const childSources = resourceui_1.getChildSources(this.kind);
            const children = Array.of();
            for (const source of childSources) {
                const sourcedChildren = yield source.children(kubectl, this);
                children.push(...sourcedChildren);
            }
            return children;
        });
    }
    getTreeItem() {
        const collapsibleState = this.isExpandable ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
        const treeItem = new vscode.TreeItem(this.name, collapsibleState);
        treeItem.command = {
            command: "extension.vsKubernetesLoad",
            title: "Load",
            arguments: [this]
        };
        treeItem.contextValue = `vsKubernetes.resource.${this.kind.abbreviation}`;
        if (this.namespace) {
            treeItem.tooltip = `Namespace: ${this.namespace}`; // TODO: show only if in non-current namespace?
        }
        const uiCustomiser = resourceui_1.getUICustomiser(this.kind);
        uiCustomiser.customiseTreeItem(this, treeItem);
        return treeItem;
    }
    get isExpandable() {
        return resourceui_1.getChildSources(this.kind).length > 0;
    }
}
exports.ResourceNode = ResourceNode;
//# sourceMappingURL=node.resource.js.map