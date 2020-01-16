"use strict";
/// <reference path='../api/vscode-kubernetes-tools-api.d.ts' />
Object.defineProperty(exports, "__esModule", { value: true });
const api = require("vscode-kubernetes-tools-api");
const clusterproviderapibroker = require("./clusterprovider/apibroker");
function apiBroker() {
    return new APIBroker();
}
exports.apiBroker = apiBroker;
class APIBroker {
    api(requested) {
        switch (requested.component) {
            case api.clusterProviderComponentId:
                return clusterproviderapibroker.api(requested.version);
            default:
                return {
                    succeeded: false,
                    reason: 'APIComponentUnknownInThisExtensionVersion',
                };
        }
    }
}
//# sourceMappingURL=apibroker.js.map