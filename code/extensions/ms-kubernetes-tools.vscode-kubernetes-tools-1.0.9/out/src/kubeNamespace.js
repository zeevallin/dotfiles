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
const extension_1 = require("./extension");
const kubectlUtils = require("./kubectlUtils");
const kuberesources = require("./kuberesources");
function useNamespaceKubernetes(explorerNode, kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        if (explorerNode) {
            if (yield kubectlUtils.switchNamespace(kubectl, explorerNode.id)) {
                extension_1.refreshExplorer();
                return;
            }
        }
        else {
            const currentNS = yield kubectlUtils.currentNamespace(kubectl);
            extension_1.promptKindName([kuberesources.allKinds.namespace], undefined, {
                prompt: 'What namespace do you want to use?',
                placeHolder: 'Enter the namespace to switch to or press enter to select from available list',
                filterNames: [currentNS]
            }, (resource) => __awaiter(this, void 0, void 0, function* () {
                if (resource) {
                    let toSwitchNamespace = resource;
                    // resource will be of format <kind>/<name>, when picked up from the quickpick
                    if (toSwitchNamespace.lastIndexOf('/') !== -1) {
                        toSwitchNamespace = toSwitchNamespace.substring(toSwitchNamespace.lastIndexOf('/') + 1);
                    }
                    // Switch if an only if the currentNS and toSwitchNamespace are different
                    if (toSwitchNamespace && currentNS !== toSwitchNamespace) {
                        const promiseSwitchNS = yield kubectlUtils.switchNamespace(kubectl, toSwitchNamespace);
                        if (promiseSwitchNS) {
                            extension_1.refreshExplorer();
                        }
                    }
                }
            }));
        }
    });
}
exports.useNamespaceKubernetes = useNamespaceKubernetes;
//# sourceMappingURL=kubeNamespace.js.map