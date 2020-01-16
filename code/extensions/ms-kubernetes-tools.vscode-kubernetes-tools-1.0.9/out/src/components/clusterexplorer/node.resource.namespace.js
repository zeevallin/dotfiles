"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kuberesources = require("../../kuberesources");
const node_resource_1 = require("./node.resource");
class NamespaceResourceNode extends node_resource_1.ResourceNode {
    constructor(name, metadata, nsinfo) {
        super(kuberesources.allKinds.namespace, name, metadata, { namespaceInfo: nsinfo });
    }
}
exports.NamespaceResourceNode = NamespaceResourceNode;
//# sourceMappingURL=node.resource.namespace.js.map