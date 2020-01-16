"use strict";
/// <reference path='../../api/vscode-kubernetes-tools-api.d.ts' />
Object.defineProperty(exports, "__esModule", { value: true });
const clusterproviderregistry_1 = require("../../../components/clusterprovider/clusterproviderregistry");
function implementation() {
    return impl;
}
exports.implementation = implementation;
class Impl {
    clusterProviderRegistry() {
        return clusterproviderregistry_1.get();
    }
}
const impl = new Impl();
//# sourceMappingURL=v1.adapter.js.map