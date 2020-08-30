"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function impl(explorer) {
    return new CloudExplorerV1Impl(explorer);
}
exports.impl = impl;
class CloudExplorerV1Impl {
    constructor(explorer) {
        this.explorer = explorer;
    }
    registerCloudProvider(cloudProvider) {
        this.explorer.register(cloudProvider);
    }
    resolveCommandTarget(target) {
        if (!target) {
            return undefined;
        }
        const node = target;
        if (node.nodeType === 'cloud') {
            return {
                nodeType: 'cloud',
                cloudName: node.provider.cloudName
            };
        }
        else if (node.nodeType === 'contributed') {
            return {
                nodeType: 'resource',
                cloudName: node.provider.cloudName,
                cloudResource: node.value
            };
        }
        return undefined;
    }
    refresh() {
        this.explorer.refresh();
    }
}
//# sourceMappingURL=v1.js.map