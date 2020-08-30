"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kuberesources = require("../../kuberesources");
const resourcekind_namespace_1 = require("./resourcekinds/resourcekind.namespace");
const resourcekind_pod_1 = require("./resourcekinds/resourcekind.pod");
const resourcekinds_selectspods_1 = require("./resourcekinds/resourcekinds.selectspods");
const resourcekind_node_1 = require("./resourcekinds/resourcekind.node");
const resourcekinds_configuration_1 = require("./resourcekinds/resourcekinds.configuration");
const specialKinds = [
    { kind: kuberesources.allKinds.namespace, lister: resourcekind_namespace_1.namespaceLister, uiCustomiser: resourcekind_namespace_1.namespaceUICustomiser },
    { kind: kuberesources.allKinds.node, childSources: [resourcekind_node_1.nodePodsChildSource] },
    { kind: kuberesources.allKinds.deployment, lister: resourcekinds_selectspods_1.hasSelectorLister, childSources: [resourcekinds_selectspods_1.selectedPodsChildSource] },
    { kind: kuberesources.allKinds.daemonSet, lister: resourcekinds_selectspods_1.hasSelectorLister, childSources: [resourcekinds_selectspods_1.selectedPodsChildSource] },
    { kind: kuberesources.allKinds.pod, lister: resourcekind_pod_1.podLister, childSources: [resourcekind_pod_1.podStatusChildSource], uiCustomiser: resourcekind_pod_1.podUICustomiser },
    { kind: kuberesources.allKinds.service, lister: resourcekinds_selectspods_1.hasSelectorLister, childSources: [resourcekinds_selectspods_1.selectedPodsChildSource] },
    { kind: kuberesources.allKinds.configMap, lister: resourcekinds_configuration_1.configResourceLister, childSources: [resourcekinds_configuration_1.configItemsChildSource] },
    { kind: kuberesources.allKinds.secret, lister: resourcekinds_configuration_1.configResourceLister, childSources: [resourcekinds_configuration_1.configItemsChildSource] },
    { kind: kuberesources.allKinds.statefulSet, lister: resourcekinds_selectspods_1.hasSelectorLister, childSources: [resourcekinds_selectspods_1.selectedPodsChildSource] },
];
function getLister(kind) {
    const descriptor = specialKinds.find((d) => d.kind.manifestKind === kind.manifestKind);
    if (descriptor) {
        return descriptor.lister;
    }
    return undefined;
}
exports.getLister = getLister;
function getChildSources(kind) {
    const descriptor = specialKinds.find((d) => d.kind.manifestKind === kind.manifestKind);
    if (descriptor) {
        return descriptor.childSources || [];
    }
    return [];
}
exports.getChildSources = getChildSources;
function getUICustomiser(kind) {
    const descriptor = specialKinds.find((d) => d.kind.manifestKind === kind.manifestKind);
    if (descriptor) {
        return descriptor.uiCustomiser || NO_CUSTOMISER;
    }
    return NO_CUSTOMISER;
}
exports.getUICustomiser = getUICustomiser;
const NO_CUSTOMISER = {
    customiseTreeItem(_resource, _treeItem) { }
};
//# sourceMappingURL=resourceui.js.map