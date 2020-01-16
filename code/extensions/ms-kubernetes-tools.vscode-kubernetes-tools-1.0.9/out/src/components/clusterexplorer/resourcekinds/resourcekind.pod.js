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
const node_resource_1 = require("../node.resource");
const kubectlUtils = require("../../../kubectlUtils");
const node_message_1 = require("../node.message");
exports.podUICustomiser = {
    customiseTreeItem(resource, treeItem) {
        const podInfo = resource.extraInfo.podInfo; // TODO: unbang
        if (podInfo && podInfo.status) {
            treeItem.iconPath = getIconForPodStatus(podInfo.status.toLowerCase());
        }
    }
};
function getIconForPodStatus(status) {
    if (status === "running" || status === "completed") {
        return vscode.Uri.file(path.join(__dirname, "../../../../../images/runningPod.svg"));
    }
    else {
        return vscode.Uri.file(path.join(__dirname, "../../../../../images/errorPod.svg"));
    }
}
exports.podStatusChildSource = {
    children(kubectl, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            const nsarg = parent.namespace ? `--namespace=${parent.namespace}` : '';
            const result = yield kubectl.asJson(`get pods ${parent.name} ${nsarg} -o json`);
            if (result.succeeded) {
                const pod = result.result;
                let ready = 0;
                pod.status.containerStatuses.forEach((status) => {
                    if (status.ready) {
                        ready++;
                    }
                });
                return [
                    new node_message_1.MessageNode(`${pod.status.phase} (${ready}/${pod.status.containerStatuses.length})`),
                    new node_message_1.MessageNode(pod.status.podIP),
                ];
            }
            else {
                return [new node_message_1.MessageNode("Error", result.error[0])];
            }
        });
    }
};
exports.podLister = {
    list(kubectl, kind) {
        return __awaiter(this, void 0, void 0, function* () {
            const pods = yield kubectlUtils.getPods(kubectl, null, null);
            return pods.map((pod) => node_resource_1.ResourceNode.create(kind, pod.name, pod.metadata, { podInfo: pod }));
        });
    }
};
//# sourceMappingURL=resourcekind.pod.js.map