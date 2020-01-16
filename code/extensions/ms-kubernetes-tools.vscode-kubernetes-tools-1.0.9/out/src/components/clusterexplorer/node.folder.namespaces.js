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
const kubectlUtils = require("../../kubectlUtils");
const kuberesources = require("../../kuberesources");
const node_folder_resource_1 = require("./node.folder.resource");
const node_resource_1 = require("./node.resource");
class NamespacesFolder extends node_folder_resource_1.ResourceFolderNode {
    constructor() {
        super(kuberesources.allKinds.namespace);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const namespaces = yield kubectlUtils.getNamespaces(kubectl);
            return namespaces.map((ns) => node_resource_1.ResourceNode.create(this.kind, ns.name, ns.metadata, { namespaceInfo: ns }));
        });
    }
}
exports.NamespacesFolder = NamespacesFolder;
//# sourceMappingURL=node.folder.namespaces.js.map