"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const explorer_1 = require("./explorer");
class ClusterExplorerNodeImpl {
    constructor(nodeType) {
        this.nodeType = nodeType;
        this.nodeCategory = explorer_1.KUBERNETES_EXPLORER_NODE_CATEGORY;
    }
}
exports.ClusterExplorerNodeImpl = ClusterExplorerNodeImpl;
//# sourceMappingURL=node.js.map