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
const errorable_1 = require("../../errorable");
const node_message_1 = require("./node.message");
const node_folder_1 = require("./node.folder");
const node_resource_1 = require("./node.resource");
const resourceui_1 = require("./resourceui");
const explorer_1 = require("./explorer");
const kubectlUtils_1 = require("../../kubectlUtils");
class ResourceFolderNode extends node_folder_1.FolderNode {
    constructor(kind) {
        super(explorer_1.NODE_TYPES.folder.resource, kind.abbreviation, kind.pluralDisplayName, "vsKubernetes.kind");
        this.kind = kind;
        this.nodeType = explorer_1.NODE_TYPES.folder.resource;
    }
    static create(kind) {
        return new ResourceFolderNode(kind);
    }
    getChildren(kubectl, host) {
        return __awaiter(this, void 0, void 0, function* () {
            const lister = resourceui_1.getLister(this.kind);
            if (lister) {
                return yield lister.list(kubectl, this.kind);
            }
            const childrenLines = yield kubectl.asLines(`get ${this.kind.abbreviation} -o custom-columns=NAME:.metadata.name,NAMESPACE:.metadata.namespace`);
            if (errorable_1.failed(childrenLines)) {
                host.showErrorMessage(childrenLines.error[0]);
                return [new node_message_1.MessageNode("Error")];
            }
            return childrenLines.result.map((line) => {
                const bits = line.split(' ');
                const metadata = {
                    name: bits[0],
                    namespace: bits[1]
                };
                return node_resource_1.ResourceNode.create(this.kind, bits[0], metadata, undefined);
            });
        });
    }
    apiURI(kubectl, namespace) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.kind.apiName) {
                return undefined;
            }
            const resources = this.kind.apiName.replace(/\s/g, '').toLowerCase();
            const version = yield kubectlUtils_1.getResourceVersion(kubectl, resources);
            if (!version) {
                return undefined;
            }
            const baseUri = (version === 'v1') ? `/api/${version}/` : `/apis/${version}/`;
            const namespaceUri = this.namespaceUriPart(namespace, resources);
            return `${baseUri}${namespaceUri}${resources}`;
        });
    }
    namespaceUriPart(ns, resources) {
        let namespaceUri = `namespaces/${ns}/`;
        switch (resources) {
            case "namespaces" || "nodes" || "persistentvolumes" || "storageclasses": {
                namespaceUri = '';
                break;
            }
            default: {
                break;
            }
        }
        return namespaceUri;
    }
}
exports.ResourceFolderNode = ResourceFolderNode;
//# sourceMappingURL=node.folder.resource.js.map