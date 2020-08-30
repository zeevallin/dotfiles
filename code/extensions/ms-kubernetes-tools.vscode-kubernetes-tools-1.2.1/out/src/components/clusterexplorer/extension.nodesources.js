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
const node_folder_grouping_custom_1 = require("./node.folder.grouping.custom");
const node_folder_resource_1 = require("./node.folder.resource");
const explorer_1 = require("./explorer");
// This module contains 'node sources' - built-in ways of creating nodes of
// *built-in* types (as opposed to the completely custom nodes created by an
// ExplorerExtender).  Node sources can be consumed and composed through the API
// to build trees that behave consistently with other folder and resource nodes.
//
// The NodeSourceImpl base class provides the common implementation of the API
// at() and if() methods.  Derived classes implement the nodes() method to
// provide specific sets of nodes - for example a set containing a single
// resource folder node (which then has resource nodes under it by virtue
// of the inherent behaviour of a resource folder).
class NodeSourceImpl {
    at(parent) {
        return new ContributedNodeSourceExtender(parent, this);
    }
    if(condition) {
        return new ConditionalNodeSource(this, condition);
    }
}
exports.NodeSourceImpl = NodeSourceImpl;
class CustomResourceFolderNodeSource extends NodeSourceImpl {
    constructor(resourceKind) {
        super();
        this.resourceKind = resourceKind;
    }
    nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            return [node_folder_resource_1.ResourceFolderNode.create(this.resourceKind)];
        });
    }
}
exports.CustomResourceFolderNodeSource = CustomResourceFolderNodeSource;
class CustomGroupingFolderNodeSource extends NodeSourceImpl {
    constructor(displayName, contextValue, children) {
        super();
        this.displayName = displayName;
        this.contextValue = contextValue;
        this.children = children;
    }
    nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            return [new node_folder_grouping_custom_1.ContributedGroupingFolderNode(this.displayName, this.contextValue, this.children)];
        });
    }
}
exports.CustomGroupingFolderNodeSource = CustomGroupingFolderNodeSource;
class ConditionalNodeSource extends NodeSourceImpl {
    constructor(impl, condition) {
        super();
        this.impl = impl;
        this.condition = condition;
    }
    nodes() {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.condition()) {
                return this.impl.nodes();
            }
            return [];
        });
    }
}
class ContributedNodeSourceExtender {
    constructor(under, nodeSource) {
        this.under = under;
        this.nodeSource = nodeSource;
    }
    contributesChildren(parent) {
        if (!parent) {
            return false;
        }
        if (this.under) {
            return parent.nodeType === explorer_1.NODE_TYPES.folder.grouping && parent.displayName === this.under;
        }
        return parent.nodeType === explorer_1.NODE_TYPES.context && parent.kubectlContext.active;
    }
    getChildren(_parent) {
        return this.nodeSource.nodes();
    }
}
exports.ContributedNodeSourceExtender = ContributedNodeSourceExtender;
//# sourceMappingURL=extension.nodesources.js.map