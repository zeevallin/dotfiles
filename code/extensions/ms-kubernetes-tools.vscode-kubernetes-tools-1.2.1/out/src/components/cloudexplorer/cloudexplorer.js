"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const providerResult = require("../../utils/providerresult");
const sleep_1 = require("../../sleep");
class CloudExplorer {
    constructor() {
        this.providers = Array.of();
        this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
    }
    getTreeItem(element) {
        if (element.nodeType === 'cloud') {
            const treeItem = new vscode.TreeItem(element.provider.cloudName, vscode.TreeItemCollapsibleState.Collapsed);
            treeItem.contextValue = `kubernetes.cloudExplorer.cloud.${element.provider.cloudName}`;
            return treeItem;
        }
        if (element.nodeType === 'message') {
            const treeItem = new vscode.TreeItem(element.text, vscode.TreeItemCollapsibleState.None);
            if (element.reason === 'no-providers') {
                treeItem.command = { title: 'Find Cloud Providers on Marketplace', command: 'kubernetes.cloudExplorer.findProviders' };
            }
            return treeItem;
        }
        return element.provider.treeDataProvider.getTreeItem(element.value);
    }
    getChildren(element) {
        if (!element) {
            if (this.providers.length === 0) {
                return [{ nodeType: 'message', reason: 'no-providers', text: 'No clouds registered. Click here to install a cloud provider from the marketplace' }];
            }
            return this.providers.map(asCloudNode);
        }
        if (element.nodeType === 'cloud') {
            const children = element.provider.treeDataProvider.getChildren(undefined);
            return asContributed(children, element.provider);
        }
        else if (element.nodeType === 'contributed') {
            const children = element.provider.treeDataProvider.getChildren(element.value);
            return asContributed(children, element.provider);
        }
        else {
            return [];
        }
    }
    refresh() {
        this.onDidChangeTreeDataEmitter.fire();
    }
    register(provider) {
        this.providers.push(provider);
        sleep_1.sleep(50).then(() => vscode.commands.executeCommand('extension.vsKubernetesRefreshCloudExplorer'));
    }
}
exports.CloudExplorer = CloudExplorer;
function asCloudNode(provider) {
    return { nodeType: 'cloud', provider: provider };
}
function asContributed(elements, provider) {
    return providerResult.map(elements, (e) => asContributedNode(e, provider));
}
function asContributedNode(element, provider) {
    return { nodeType: 'contributed', provider: provider, value: element };
}
//# sourceMappingURL=cloudexplorer.js.map