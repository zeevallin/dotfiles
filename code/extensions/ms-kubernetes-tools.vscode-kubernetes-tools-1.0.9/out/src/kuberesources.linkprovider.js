"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const querystring = require("querystring");
const _ = require("lodash");
const kuberesources = require("./kuberesources");
const kuberesources_virtualfs_1 = require("./kuberesources.virtualfs");
const helm_exec_1 = require("./helm.exec");
const yl = require("./yaml-support/yaml-locator");
class KubernetesResourceLinkProvider {
    provideDocumentLinks(document, _token) {
        const sourceKind = k8sKind(document);
        const yaml = yl.yamlLocator.getYamlDocuments(document);
        const leaves = getLeafNodes(yaml);
        const links = leaves.choose((l) => getLink(document, sourceKind, l));
        return links;
    }
}
exports.KubernetesResourceLinkProvider = KubernetesResourceLinkProvider;
function getLeafNodes(yaml) {
    const rootNodes = _.flatMap(yaml, (d) => d.nodes);
    const nonRootNodes = _.flatMap(rootNodes, (n) => descendants(n));
    const allNodes = rootNodes.concat(nonRootNodes);
    const leafNodes = allNodes.filter((n) => isLeaf(n));
    return leafNodes;
}
function getLink(document, sourceKind, node) {
    if (yl.isMappingItem(node)) {
        return getLinkFromPair(document, sourceKind, node);
    }
    return undefined;
}
function range(document, node) {
    return new vscode.Range(document.positionAt(node.value.startPosition), document.positionAt(node.value.endPosition));
}
function descendants(node) {
    const direct = children(node);
    const indirect = direct.map((n) => descendants(n));
    const all = direct.concat(...indirect);
    return all;
}
function children(node) {
    if (yl.isMapping(node)) {
        return node.mappings;
    }
    else if (yl.isSequence(node)) {
        return node.items;
    }
    else if (yl.isMappingItem(node)) {
        if (yl.isMapping(node.value) || yl.isSequence(node.value)) {
            return [node.value];
        }
        return [];
    }
    else {
        return [];
    }
}
function isLeaf(node) {
    return yl.isMappingItem(node) && node.value.kind === 'SCALAR';
}
function key(node) {
    if (node && yl.isMappingItem(node)) {
        return node.key.raw;
    }
    return undefined;
}
function parentKey(node) {
    const parent = node.parent;
    if (!parent) {
        return undefined;
    }
    if (parent.parent && yl.isMapping(parent.parent)) {
        const parentPair = parent.parent.mappings.find((mi) => mi.value === parent); // safe because we are looking for our own mapping
        const parentKey = key(parentPair);
        if (parentKey) {
            return parentKey;
        }
    }
    return parentKey(parent);
}
function siblings(node) {
    const parent = node.parent;
    if (parent && yl.isMapping(parent)) {
        return parent.mappings;
    }
    return [];
}
function sibling(node, name) {
    return siblings(node).filter((n) => n.key.raw === name)
        .map((n) => n.value.raw)[0];
}
function getLinkFromPair(document, sourceKind, node) {
    const uri = getLinkUri(sourceKind, node);
    if (!uri) {
        return undefined;
    }
    return new vscode.DocumentLink(range(document, node), uri);
}
function getLinkUri(sourceKind, node) {
    // Things that apply to all source resource types
    if (key(node) === 'release' && parentKey(node) === 'labels') {
        return helm_exec_1.helmfsUri(node.value.raw);
    }
    if (key(node) === 'namespace' && parentKey(node) === 'metadata') {
        return kuberesources_virtualfs_1.kubefsUri(null, `ns/${node.value.raw}`, 'yaml');
    }
    if (key(node) === 'name' && parentKey(node) === 'ownerReferences') {
        const ownerKind = k8sKindFromManifestKind(sibling(node, 'kind'));
        if (ownerKind) {
            return kuberesources_virtualfs_1.kubefsUri(null, `${ownerKind}/${node.value.raw}`, 'yaml');
        }
    }
    // Source=type-specific navigation
    switch (sourceKind) {
        case kuberesources.allKinds.deployment.abbreviation:
            return getLinkUriFromDeployment(node);
        case kuberesources.allKinds.persistentVolume.abbreviation:
            return getLinkUriFromPV(node);
        case kuberesources.allKinds.persistentVolumeClaim.abbreviation:
            return getLinkUriFromPVC(node);
        default:
            return undefined;
    }
}
function getLinkUriFromDeployment(node) {
    if (key(node) === 'claimName' && parentKey(node) === 'persistentVolumeClaim') {
        return kuberesources_virtualfs_1.kubefsUri(null, `pvc/${node.value.raw}`, 'yaml');
    }
    else if (key(node) === 'name' && parentKey(node) === 'configMap') {
        return kuberesources_virtualfs_1.kubefsUri(null, `cm/${node.value.raw}`, 'yaml');
    }
    else if (key(node) === 'name' && parentKey(node) === 'secretKeyRef') {
        return kuberesources_virtualfs_1.kubefsUri(null, `secrets/${node.value.raw}`, 'yaml');
    }
    else {
        return undefined;
    }
}
function getLinkUriFromPV(node) {
    if (key(node) === 'storageClassName') {
        return kuberesources_virtualfs_1.kubefsUri(null, `sc/${node.value.raw}`, 'yaml');
    }
    else if (key(node) === 'name' && parentKey(node) === 'claimRef') {
        return kuberesources_virtualfs_1.kubefsUri(sibling(node, 'namespace'), `pvc/${node.value.raw}`, 'yaml');
    }
    else {
        return undefined;
    }
}
function getLinkUriFromPVC(node) {
    if (key(node) === 'storageClassName') {
        return kuberesources_virtualfs_1.kubefsUri(null, `sc/${node.value.raw}`, 'yaml');
    }
    else if (key(node) === 'volumeName') {
        return kuberesources_virtualfs_1.kubefsUri(null, `pv/${node.value.raw}`, 'yaml');
    }
    else {
        return undefined;
    }
}
function k8sKind(document) {
    const query = querystring.parse(document.uri.query);
    const k8sid = query.value;
    const kindSepIndex = k8sid.indexOf('/');
    return k8sid.substring(0, kindSepIndex);
}
function k8sKindFromManifestKind(manifestKind) {
    if (!manifestKind) {
        return undefined;
    }
    const resourceKind = kuberesources.findKind(manifestKind);
    return resourceKind ? resourceKind.abbreviation : undefined;
}
//# sourceMappingURL=kuberesources.linkprovider.js.map