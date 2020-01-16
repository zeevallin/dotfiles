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
const array_1 = require("../../../utils/array");
const nodesources_1 = require("./nodesources");
const node_folder_grouping_1 = require("../node.folder.grouping");
class CustomGroupingFolderNodeSource extends nodesources_1.NodeSource {
    constructor(displayName, contextValue, children) {
        super();
        this.displayName = displayName;
        this.contextValue = contextValue;
        this.children = children;
    }
    nodes(_kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            return [new ContributedGroupingFolderNode(this.displayName, this.contextValue, this.children)];
        });
    }
}
exports.CustomGroupingFolderNodeSource = CustomGroupingFolderNodeSource;
class ContributedGroupingFolderNode extends node_folder_grouping_1.GroupingFolderNode {
    constructor(displayName, contextValue, children) {
        super('folder.grouping.custom', displayName, contextValue);
        this.children = children;
    }
    getChildren(kubectl, host) {
        return this.getChildrenImpl(kubectl, host);
    }
    getChildrenImpl(kubectl, host) {
        return __awaiter(this, void 0, void 0, function* () {
            const allNodesPromise = Promise.all(this.children.map((c) => c.nodes(kubectl, host)));
            const nodeArrays = yield allNodesPromise;
            const nodes = array_1.flatten(...nodeArrays);
            return nodes;
        });
    }
}
//# sourceMappingURL=folder.grouping.js.map