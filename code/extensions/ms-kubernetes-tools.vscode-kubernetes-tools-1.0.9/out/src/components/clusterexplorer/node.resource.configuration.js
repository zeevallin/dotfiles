"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_resource_1 = require("./node.resource");
class ConfigurationResourceNode extends node_resource_1.ResourceNode {
    constructor(kind, name, metadata, data) {
        super(kind, name, metadata, { configData: data });
    }
}
exports.ConfigurationResourceNode = ConfigurationResourceNode;
//# sourceMappingURL=node.resource.configuration.js.map