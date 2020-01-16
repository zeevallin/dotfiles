"use strict";
/// <reference path='../../api/vscode-kubernetes-tools-api.d.ts' />
Object.defineProperty(exports, "__esModule", { value: true });
const explorer_1 = require("../../../explorer");
function implementation() {
    return impl;
}
exports.implementation = implementation;
class Impl {
    asClusterTreeNode(treeNode) {
        if (explorer_1.isKubernetesExplorerResourceNode(treeNode)) {
            return {
                resourceId: treeNode.resourceId,
                uri: treeNode.uri('yaml'),
            };
        }
        return undefined;
    }
}
const impl = new Impl();
//# sourceMappingURL=v1.adapter.js.map