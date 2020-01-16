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
            const childrenLines = yield kubectl.asLines(`get ${this.kind.abbreviation}`);
            if (errorable_1.failed(childrenLines)) {
                host.showErrorMessage(childrenLines.error[0]);
                return [new node_message_1.MessageNode("Error")];
            }
            return childrenLines.result.map((line) => {
                const bits = line.split(' ');
                return node_resource_1.ResourceNode.create(this.kind, bits[0], undefined, undefined);
            });
        });
    }
}
exports.ResourceFolderNode = ResourceFolderNode;
//# sourceMappingURL=node.folder.resource.js.map