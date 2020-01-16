"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const querystring = require("querystring");
const kuberesources = require("./kuberesources");
const yaml_navigation_1 = require("./yaml-support/yaml-navigation");
const kuberesources_virtualfs_1 = require("./kuberesources.virtualfs");
const helm_exec_1 = require("./helm.exec");
class KubernetesResourceDefinitionProvider {
    provideDefinition(document, position, token) {
        return this.provideDefinitionAsync(document, position);
    }
    provideDefinitionAsync(document, position) {
        return __awaiter(this, void 0, void 0, function* () {
            // JOYOUS FACT: the YAML thingy does NOT give us symbols.  Let's kludge it for now.
            const currentLine = parseYamlLine(document, position.line);
            if (!currentLine || !currentLine.value) {
                return undefined;
            }
            const parentLineIndex = yaml_navigation_1.findParentYaml(document, position.line);
            const parentLine = parseYamlLine(document, parentLineIndex);
            // TODO: some sources can include namespaces references e.g. claimRef has name and namespace children
            const source = {
                key: currentLine.key,
                value: currentLine.value,
                parentKey: parentLine ? parentLine.key : undefined,
                kind: k8sKind(document)
            };
            const targetUri = findNavigationTarget(source);
            if (!targetUri) {
                return undefined;
            }
            return new vscode.Location(targetUri, new vscode.Position(0, 0));
        });
    }
}
exports.KubernetesResourceDefinitionProvider = KubernetesResourceDefinitionProvider;
function findNavigationTarget(source) {
    // Things that apply to all source resource types
    if (source.key === 'release' && source.parentKey === 'labels') {
        return helm_exec_1.helmfsUri(source.value);
    }
    if (source.key === 'namespace' && source.parentKey === 'metadata') {
        return kuberesources_virtualfs_1.kubefsUri(null, `ns/${source.value}`, 'yaml');
    }
    // Source=type-specific navigation
    switch (source.kind) {
        case kuberesources.allKinds.deployment.abbreviation:
            return findNavigationTargetFromDeployment(source);
        case kuberesources.allKinds.persistentVolume.abbreviation:
            return findNavigationTargetFromPV(source);
        case kuberesources.allKinds.persistentVolumeClaim.abbreviation:
            return findNavigationTargetFromPVC(source);
        default:
            return undefined;
    }
}
function findNavigationTargetFromDeployment(source) {
    if (source.key === 'claimName' && source.parentKey === 'persistentVolumeClaim') {
        return kuberesources_virtualfs_1.kubefsUri(null, `pvc/${source.value}`, 'yaml');
    }
    else if (source.key === 'name' && source.parentKey === 'configMap') {
        return kuberesources_virtualfs_1.kubefsUri(null, `cm/${source.value}`, 'yaml');
    }
    else if (source.key === 'name' && source.parentKey === 'secretKeyRef') {
        return kuberesources_virtualfs_1.kubefsUri(null, `secrets/${source.value}`, 'yaml');
    }
    else {
        return undefined;
    }
}
function findNavigationTargetFromPV(source) {
    if (source.key === 'storageClassName') {
        return kuberesources_virtualfs_1.kubefsUri(null, `sc/${source.value}`, 'yaml');
    }
    else if (source.key === 'name' && source.parentKey === 'claimRef') {
        return kuberesources_virtualfs_1.kubefsUri(null, `pvc/${source.value}`, 'yaml');
    }
    else {
        return undefined;
    }
}
function findNavigationTargetFromPVC(source) {
    if (source.key === 'storageClassName') {
        return kuberesources_virtualfs_1.kubefsUri(null, `sc/${source.value}`, 'yaml');
    }
    else if (source.key === 'volumeName') {
        return kuberesources_virtualfs_1.kubefsUri(null, `pv/${source.value}`, 'yaml');
    }
    else {
        return undefined;
    }
}
function parseYamlLine(document, lineIndex) {
    const currentLine = document.lineAt(lineIndex).text.trim();
    const keySeparatorIndex = currentLine.indexOf(':');
    if (keySeparatorIndex < 0) {
        return undefined;
    }
    const key = currentLine.substring(0, keySeparatorIndex).trim();
    const value = currentLine.substring(keySeparatorIndex + 1).trim();
    return { key: nameOnly(key), value: value };
}
function k8sKind(document) {
    const query = querystring.parse(document.uri.query);
    const k8sid = query.value;
    const kindSepIndex = k8sid.indexOf('/');
    return k8sid.substring(0, kindSepIndex);
}
const YAML_SECTION_WART = '- ';
function nameOnly(key) {
    if (key.startsWith(YAML_SECTION_WART)) {
        return key.substring(YAML_SECTION_WART.length);
    }
    return key;
}
//# sourceMappingURL=kuberesources.definitionprovider.js.map