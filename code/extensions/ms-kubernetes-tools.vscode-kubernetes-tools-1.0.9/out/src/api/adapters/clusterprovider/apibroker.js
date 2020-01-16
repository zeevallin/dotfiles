"use strict";
/// <reference path='../../api/vscode-kubernetes-tools-api.d.ts' />
Object.defineProperty(exports, "__esModule", { value: true });
const v1 = require("vscode-kubernetes-tools-api.clusterprovider.v1");
const v1adapter = require("./v1.adapter");
function api(version) {
    switch (version) {
        case "0.1":
        case "0.2":
            return {
                succeeded: false,
                reason: 'APIVersionNoLongerSupported',
            };
        case v1.versionId:
            return {
                succeeded: true,
                api: v1adapter.implementation()
            };
        default:
            return {
                succeeded: false,
                reason: 'APIVersionUnknownInThisExtensionVersion',
            };
    }
}
exports.api = api;
//# sourceMappingURL=apibroker.js.map