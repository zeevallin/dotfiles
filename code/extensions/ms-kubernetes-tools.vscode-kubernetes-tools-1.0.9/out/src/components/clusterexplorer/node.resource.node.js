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
const kubectlUtils = require("../../kubectlUtils");
const kuberesources = require("../../kuberesources");
const node_resource_1 = require("./node.resource");
const resourcenodefactory_1 = require("./resourcenodefactory");
class NodeClusterExplorerNode extends node_resource_1.ResourceNode {
    constructor(name, metadata) {
        super(kuberesources.allKinds.node, name, metadata, undefined);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const pods = yield kubectlUtils.getPods(kubectl, null, 'all');
            const filteredPods = pods.filter((p) => `node/${p.nodeName}` === this.kindName);
            return filteredPods.map((p) => resourcenodefactory_1.resourceNodeCreate(kuberesources.allKinds.pod, p.name, p.metadata, { podInfo: p }));
        });
    }
    get isExpandable() {
        return true;
    }
}
exports.NodeClusterExplorerNode = NodeClusterExplorerNode;
//# sourceMappingURL=node.resource.node.js.map