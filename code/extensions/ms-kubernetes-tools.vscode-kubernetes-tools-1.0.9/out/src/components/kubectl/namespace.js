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
const explorer_1 = require("../clusterprovider/common/explorer");
const extension_1 = require("../../extension");
const host_1 = require("../../host");
const kubectlUtils = require("../../kubectlUtils");
const kuberesources = require("../../kuberesources");
const explorer_2 = require("../clusterexplorer/explorer");
function useNamespaceKubernetes(kubectl, explorerNode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (explorerNode && explorerNode.nodeType === explorer_2.NODE_TYPES.resource) {
            if (yield kubectlUtils.switchNamespace(kubectl, explorerNode.name)) {
                explorer_1.refreshExplorer();
                host_1.host.showInformationMessage(`Switched to namespace ${explorerNode.name}`);
                return;
            }
        }
        const currentNS = yield kubectlUtils.currentNamespace(kubectl);
        extension_1.promptKindName([kuberesources.allKinds.namespace], '', // unused because options specify prompt
        {
            prompt: 'What namespace do you want to use?',
            placeHolder: 'Enter the namespace to switch to or press enter to select from available list',
            filterNames: [currentNS]
        }, (kindName) => switchToNamespace(kubectl, currentNS, kindName));
    });
}
exports.useNamespaceKubernetes = useNamespaceKubernetes;
function switchToNamespace(kubectl, currentNS, resource) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!resource) {
            return;
        }
        let toSwitchNamespace = resource;
        // resource will be of format <kind>/<name>, when picked up from the quickpick
        if (toSwitchNamespace.lastIndexOf('/') !== -1) {
            toSwitchNamespace = toSwitchNamespace.substring(toSwitchNamespace.lastIndexOf('/') + 1);
        }
        // Switch if an only if the currentNS and toSwitchNamespace are different
        if (toSwitchNamespace && currentNS !== toSwitchNamespace) {
            if (yield kubectlUtils.switchNamespace(kubectl, toSwitchNamespace)) {
                explorer_1.refreshExplorer();
                host_1.host.showInformationMessage(`Switched to namespace ${toSwitchNamespace}`);
            }
        }
    });
}
//# sourceMappingURL=namespace.js.map