"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RegistryImpl {
    constructor() {
        this.providers = new Array();
    }
    register(clusterProvider) {
        console.log(`You registered cluster type ${clusterProvider.id}`);
        this.providers.push(clusterProvider);
    }
    list() {
        let copy = new Array();
        copy = copy.concat(this.providers);
        return copy;
    }
}
const registryImpl = new RegistryImpl();
function get() {
    return registryImpl;
}
exports.get = get;
//# sourceMappingURL=clusterproviderregistry.js.map