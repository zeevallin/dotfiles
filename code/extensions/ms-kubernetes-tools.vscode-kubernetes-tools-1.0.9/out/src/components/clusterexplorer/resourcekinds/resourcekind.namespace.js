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
const node_resource_1 = require("../node.resource");
const kubectlUtils = require("../../../kubectlUtils");
exports.namespaceUICustomiser = {
    customiseTreeItem(resource, treeItem) {
        const namespaceInfo = resource.extraInfo.namespaceInfo; // TODO: unbang
        if (namespaceInfo.active) {
            treeItem.label = "* " + treeItem.label;
        }
        else {
            treeItem.contextValue += ".inactive";
        }
    }
};
exports.namespaceLister = {
    list(kubectl, kind) {
        return __awaiter(this, void 0, void 0, function* () {
            const namespaces = yield kubectlUtils.getNamespaces(kubectl);
            return namespaces.map((ns) => node_resource_1.ResourceNode.create(kind, ns.name, ns.metadata, { namespaceInfo: ns }));
        });
    }
};
//# sourceMappingURL=resourcekind.namespace.js.map