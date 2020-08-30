"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ResourceKind {
    constructor(displayName, pluralDisplayName, manifestKind, abbreviation, apiName) {
        this.displayName = displayName;
        this.pluralDisplayName = pluralDisplayName;
        this.manifestKind = manifestKind;
        this.abbreviation = abbreviation;
        this.apiName = apiName;
    }
    get label() { return this.displayName; }
    get description() { return ''; }
}
exports.ResourceKind = ResourceKind;
exports.allKinds = {
    endpoint: new ResourceKind("Endpoint", "Endpoints", "Endpoint", "endpoints", "endpoints"),
    namespace: new ResourceKind("Namespace", "Namespaces", "Namespace", "namespace", "namespaces"),
    node: new ResourceKind("Node", "Nodes", "Node", "node", "nodes"),
    deployment: new ResourceKind("Deployment", "Deployments", "Deployment", "deployment", "deployments"),
    daemonSet: new ResourceKind("DaemonSet", "DaemonSets", "DaemonSet", "daemonset", "daemonsets"),
    replicaSet: new ResourceKind("ReplicaSet", "ReplicaSets", "ReplicaSet", "rs", "replicasets"),
    replicationController: new ResourceKind("Replication Controller", "Replication Controllers", "ReplicationController", "rc", "replicationcontrollers"),
    job: new ResourceKind("Job", "Jobs", "Job", "job", "jobs"),
    cronjob: new ResourceKind("CronJob", "CronJobs", "CronJob", "cronjob", "cronjobs"),
    pod: new ResourceKind("Pod", "Pods", "Pod", "pod", "pods"),
    crd: new ResourceKind("Custom Resource", "Custom Resources", "CustomResourceDefinition", "crd", "customresources"),
    service: new ResourceKind("Service", "Services", "Service", "service", "services"),
    configMap: new ResourceKind("ConfigMap", "Config Maps", "ConfigMap", "configmap", "configmaps"),
    secret: new ResourceKind("Secret", "Secrets", "Secret", "secret", "secrets"),
    ingress: new ResourceKind("Ingress", "Ingress", "Ingress", "ingress", "ingress"),
    persistentVolume: new ResourceKind("Persistent Volume", "Persistent Volumes", "PersistentVolume", "pv", "persistentvolumes"),
    persistentVolumeClaim: new ResourceKind("Persistent Volume Claim", "Persistent Volume Claims", "PersistentVolumeClaim", "pvc", "persistentvolumeclaims"),
    storageClass: new ResourceKind("Storage Class", "Storage Classes", "StorageClass", "sc", "storageclasses"),
    statefulSet: new ResourceKind("StatefulSet", "StatefulSets", "StatefulSet", "statefulset", "statefulsets")
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