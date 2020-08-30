"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isObjectMeta(obj) {
    return obj && obj.name;
}
function isKubernetesResource(obj) {
    return obj && obj.kind && isObjectMeta(obj.metadata);
}
exports.isKubernetesResource = isKubernetesResource;
function isPod(obj) {
    return isKubernetesResource(obj) && obj.kind === 'Pod';
}
exports.isPod = isPod;
//# sourceMappingURL=kuberesources.objectmodel.js.map