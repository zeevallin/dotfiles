"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kuberesources = require("../../kuberesources");
const node_folder_1 = require("./node.folder");
const node_folder_resource_1 = require("./node.folder.resource");
const explorer_1 = require("./explorer");
class GroupingFolderNode extends node_folder_1.FolderNode {
    constructor(id, displayName, contextValue) {
        super(explorer_1.NODE_TYPES.folder.grouping, id, displayName, contextValue);
        this.nodeType = explorer_1.NODE_TYPES.folder.grouping;
    }
    static of(id, displayName, ...kinds) {
        return new ResourceKindsGroupingFolder(id, displayName, kinds);
    }
}
exports.GroupingFolderNode = GroupingFolderNode;
exports.workloadsGroupingFolder = () => GroupingFolderNode.of("workload", "Workloads", kuberesources.allKinds.deployment, kuberesources.allKinds.statefulSet, kuberesources.allKinds.daemonSet, kuberesources.allKinds.job, kuberesources.allKinds.cronjob, kuberesources.allKinds.pod);
class ResourceKindsGroupingFolder extends GroupingFolderNode {
    constructor(id, displayName, kinds) {
        super(id, displayName);
        this.kinds = kinds;
    }
    getChildren(_kubectl, _host) {
        return this.kinds.map((k) => node_folder_resource_1.ResourceFolderNode.create(k));
    }
}
exports.configurationGroupingFolder = () => GroupingFolderNode.of("config", "Configuration", kuberesources.allKinds.configMap, kuberesources.allKinds.secret);
exports.networkGroupingFolder = () => GroupingFolderNode.of("network", "Network", kuberesources.allKinds.service, kuberesources.allKinds.endpoint, kuberesources.allKinds.ingress);
exports.storageGroupingFolder = () => GroupingFolderNode.of("storage", "Storage", kuberesources.allKinds.persistentVolume, kuberesources.allKinds.persistentVolumeClaim, kuberesources.allKinds.storageClass);
//# sourceMappingURL=node.folder.grouping.js.map