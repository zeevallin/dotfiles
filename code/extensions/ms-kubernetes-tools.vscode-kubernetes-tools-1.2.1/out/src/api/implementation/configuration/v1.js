"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kubeconfig_1 = require("../../../components/kubectl/kubeconfig");
function impl() {
    return new ConfigurationV1Impl();
}
exports.impl = impl;
class ConfigurationV1Impl {
    getKubeconfigPath() {
        return kubeconfig_1.getKubeconfigPath();
    }
}
//# sourceMappingURL=v1.js.map