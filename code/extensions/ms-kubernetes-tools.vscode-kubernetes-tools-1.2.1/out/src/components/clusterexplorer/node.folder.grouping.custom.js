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
const array_1 = require("../../utils/array");
const node_folder_grouping_1 = require("./node.folder.grouping");
class ContributedGroupingFolderNode extends node_folder_grouping_1.GroupingFolderNode {
    constructor(displayName, contextValue, children) {
        super('folder.grouping.custom', displayName, contextValue);
        this.children = children;
    }
    getChildren(_kubectl, _host) {
        return this.getChildrenImpl();
    }
    getChildrenImpl() {
        return __awaiter(this, void 0, void 0, function* () {
            const allNodesPromise = Promise.all(this.children.map((c) => c.nodes()));
            const nodeArrays = yield allNodesPromise;
            const nodes = array_1.flatten(...nodeArrays);
            return nodes;
        });
    }
}
exports.ContributedGroupingFolderNode = ContributedGroupingFolderNode;
//# sourceMappingURL=node.folder.grouping.custom.js.map