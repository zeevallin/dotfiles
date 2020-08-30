"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const errorable_1 = require("../../errorable");
const helmexec = require("../../helm.exec");
const explorer_1 = require("./explorer");
const node_1 = require("./node");
const node_message_1 = require("./node.message");
const moment = require("moment");
class HelmHistoryNode extends node_1.ClusterExplorerNodeImpl {
    constructor(releaseName, revision, updated, status) {
        super(explorer_1.NODE_TYPES.helm.history);
        this.releaseName = releaseName;
        this.revision = revision;
        this.updated = updated;
        this.status = status;
        this.nodeType = explorer_1.NODE_TYPES.helm.history;
    }
    getTreeItem() {
        const updatedTime = moment(this.updated).fromNow();
        const treeItem = new vscode.TreeItem(`${this.revision} - ${this.status} (${updatedTime})`, vscode.TreeItemCollapsibleState.None);
        treeItem.command = {
            command: "extension.helmGet",
            title: "Get",
            arguments: [this]
        };
        treeItem.contextValue = "vsKubernetes.helmHistory";
        return treeItem;
    }
    getChildren(_kubectl, _host) {
        return [];
    }
    apiURI(_kubectl, _namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.HelmHistoryNode = HelmHistoryNode;
class HelmReleaseNode extends node_1.ClusterExplorerNodeImpl {
    constructor(releaseName, status) {
        super(explorer_1.NODE_TYPES.helm.release);
        this.releaseName = releaseName;
        this.status = status;
        this.nodeType = explorer_1.NODE_TYPES.helm.release;
    }
    getChildren(_kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!helmexec.ensureHelm(helmexec.EnsureMode.Silent)) {
                return [new node_message_1.MessageNode("Helm client is not installed")];
            }
            const history = yield helmexec.helmGetHistory(this.releaseName);
            if (errorable_1.failed(history)) {
                return [new node_message_1.MessageNode("Helm history list error", history.error[0])];
            }
            return history.result.map((r) => new HelmHistoryNode(this.releaseName, r.revision, r.updated, r.status));
        });
    }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.releaseName, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.command = {
            command: "extension.helmGet",
            title: "Get",
            arguments: [this]
        };
        treeItem.contextValue = "vsKubernetes.helmRelease";
        treeItem.iconPath = getIconForHelmRelease(this.status.toLowerCase());
        return treeItem;
    }
    apiURI(_kubectl, _namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
}
exports.HelmReleaseNode = HelmReleaseNode;
function getIconForHelmRelease(status) {
    if (status === "deployed") {
        return vscode.Uri.file(path.join(__dirname, "../../../../images/helmDeployed.svg"));
    }
    if (status === "superseeded") {
        return vscode.Uri.file(path.join(__dirname, "../../../../images/helmDeployed.svg"));
    }
    if (status === "failed") {
        return vscode.Uri.file(path.join(__dirname, "../../../../images/helmFailed.svg"));
    }
    return vscode.Uri.file(path.join(__dirname, "../../../../images/helmDeployed.svg"));
}
//# sourceMappingURL=node.helmrelease.js.map