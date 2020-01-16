"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResourceKind {
    constructor(displayName, pluralDisplayName, manifestKind, abbreviation) {
        this.displayName = displayName;
        this.pluralDisplayName = pluralDisplayName;
        this.manifestKind = manifestKind;
        this.abbreviation = abbreviation;
    }
    get label() { return this.displayName; }
    get description() { return ''; }
}
exports.ResourceKind = ResourceKind;
exports.allKinds = {
    endpoint: new ResourceKind("Endpoint", "Endpoints", "Endpoint", "endpoints"),
    namespace: new ResourceKind("Namespace", "Namespaces", "Namespace", "namespace"),
    node: new ResourceKind("Node", "Nodes", "Node", "node"),
    deployment: new ResourceKind("Deployment", "Deployments", "Deployment", "deployment"),
    daemonSet: new ResourceKind("DaemonSet", "DaemonSets", "DaemonSet", "daemonset"),
    replicaSet: new ResourceKind("ReplicaSet", "ReplicaSets", "ReplicaSet", "rs"),
    replicationController: new ResourceKind("Replication Controller", "Replication Controllers", "ReplicationController", "rc"),
    job: new ResourceKind("Job", "Jobs", "Job", "job"),
    cronjob: new ResourceKind("CronJob", "CronJobs", "CronJob", "cronjob"),
    pod: new ResourceKind("Pod", "Pods", "Pod", "pod"),
    crd: new ResourceKind("Custom Resource", "Custom Resources", "CustomResourceDefinition", "crd"),
    service: new ResourceKind("Service", "Services", "Service", "service"),
    configMap: new ResourceKind("ConfigMap", "Config Maps", "ConfigMap", "configmap"),
    secret: new ResourceKind("Secret", "Secrets", "Secret", "secret"),
    ingress: new ResourceKind("Ingress", "Ingress", "Ingress", "ingress"),
    persistentVolume: new ResourceKind("Persistent Volume", "Persistent Volumes", "PersistentVolume", "pv"),
    persistentVolumeClaim: new ResourceKind("Persistent Volume Claim", "Persistent Volume Claims", "PersistentVolumeClaim", "pvc"),
    storageClass: new ResourceKind("Storage Class", "Storage Classes", "StorageClass", "sc"),
    statefulSet: new ResourceKind("StatefulSet", "StatefulSets", "StatefulSet", "statefulset"),
};
exports.commonKinds = [
    exports.allKinds.deployment,
    exports.allKinds.job,
    exports.allKinds.pod,
    exports.allKinds.service,
];
exports.scaleableKinds = [
    exports.allKinds.deployment,
    exports.allKinds.replicaSet,
    exports.allKinds.replicationController,
    exports.allKinds.job,
    exports.allKinds.statefulSet,
];
exports.exposableKinds = [
    exports.allKinds.deployment,
    exports.allKinds.pod,
    exports.allKinds.replicationController,
    exports.allKinds.replicaSet,
    exports.allKinds.service,
];
function findKind(manifestKind) {
    for (const k in exports.allKinds) {
        if (exports.allKinds[k].manifestKind === manifestKind) {
            return exports.allKinds[k];
        }
    }
    return undefined;
}
exports.findKind = findKind;
//# sourceMappingURL=kuberesources.js.map