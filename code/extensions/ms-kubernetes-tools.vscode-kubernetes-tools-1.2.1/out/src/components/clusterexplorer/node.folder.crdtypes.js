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
const kubectlUtils = require("../../kubectlUtils");
const kuberesources = require("../../kuberesources");
const node_folder_grouping_1 = require("./node.folder.grouping");
const node_folder_resource_1 = require("./node.folder.resource");
class CRDTypesFolderNode extends node_folder_grouping_1.GroupingFolderNode {
    constructor() {
        super(kuberesources.allKinds.crd.abbreviation, kuberesources.allKinds.crd.pluralDisplayName);
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            const objects = yield kubectlUtils.getCRDTypes(kubectl);
            return objects.map((obj) => node_folder_resource_1.ResourceFolderNode.create(this.customResourceKind(obj)));
        });
    }
    customResourceKind(crd) {
        return new kuberesources.ResourceKind(crd.spec.names.singular, crd.spec.names.plural, crd.spec.names.kind, this.safeAbbreviation(crd), crd.spec.names.plural);
    }
    safeAbbreviation(crd) {
        const shortNames = crd.spec.names.shortNames;
        return (shortNames && shortNames.length > 0) ? shortNames[0] : crd.metadata.name;
    }
}
exports.CRDTypesFolderNode = CRDTypesFolderNode;
//# sourceMappingURL=node.folder.crdtypes.js.map