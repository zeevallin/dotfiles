"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apiutils_1 = require("./apiutils");
const clusterprovider = require("./clusterprovider/versions");
const kubectl = require("./kubectl/versions");
const helm = require("./helm/versions");
const clusterexplorer = require("./cluster-explorer/versions");
const cloudexplorer = require("./cloudexplorer/versions");
const configuration = require("./configuration/versions");
function apiBroker(clusterProviderRegistry, kubectlImpl, portForwardStatusBarManager, explorer, cloudExplorer) {
    return {
        get(component, version) {
            switch (component) {
                case "clusterprovider": return clusterprovider.apiVersion(clusterProviderRegistry, version);
                case "kubectl": return kubectl.apiVersion(kubectlImpl, portForwardStatusBarManager, version);
                case "helm": return helm.apiVersion(version);
                case "clusterexplorer": return clusterexplorer.apiVersion(explorer, version);
                case "cloudexplorer": return cloudexplorer.apiVersion(cloudExplorer, version);
                case "configuration": return configuration.apiVersion(version);
                default: return apiutils_1.versionUnknown;
            }
        },
        // Backward compatibility
        apiVersion: '1.0',
        clusterProviderRegistry: clusterProviderRegistry
    };
}
exports.apiBroker = apiBroker;
//# sourceMappingURL=apibroker.js.map