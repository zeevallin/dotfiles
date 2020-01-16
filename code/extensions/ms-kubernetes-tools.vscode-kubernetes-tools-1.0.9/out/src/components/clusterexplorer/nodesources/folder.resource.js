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
const node_folder_resource_1 = require("../node.folder.resource");
const nodesources_1 = require("./nodesources");
class CustomResourceFolderNodeSource extends nodesources_1.NodeSource {
    constructor(resourceKind, options) {
        super();
        this.resourceKind = resourceKind;
        this.options = options;
    }
    nodes(_kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            return [node_folder_resource_1.ResourceFolderNode.create(this.resourceKind, this.options)];
        });
    }
}
exports.CustomResourceFolderNodeSource = CustomResourceFolderNodeSource;
//# sourceMappingURL=folder.resource.js.map