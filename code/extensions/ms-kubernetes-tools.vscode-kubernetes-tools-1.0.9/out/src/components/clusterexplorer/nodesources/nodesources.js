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
const explorer_1 = require("../explorer");
// This directory contains 'node sources' - built-in ways of creating nodes of
// *built-in* types (as opposed to the completely custom nodes created by an
// ExplorerExtender).  Node sources can be consumed and composed through the API
// to build trees that behave consistently with other folder and resource nodes.
//
// The NodeSource base class provides the common implementation of the API
// at() and if() methods.  Derived classes implement the nodes() method to
// provide specific sets of nodes - for example a set containing a single
// resource folder node (which then has resource nodes under it by virtue
// of the inherent behaviour of a resource folder).
class NodeSource {
    at(parent) {
        return new ContributedNodeSourceExtender(parent, this);
    }
    if(condition) {
        return new ConditionalNodeSource(this, condition);
    }
}
exports.NodeSource = NodeSource;
class ConditionalNodeSource extends NodeSource {
    constructor(impl, condition) {
        super();
        this.impl = impl;
        this.condition = condition;
    }
    nodes(kubectl, host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield this.condition()) {
                return this.impl.nodes(kubectl, host);
            }
            return [];
        });
    }
}
exports.ConditionalNodeSource = ConditionalNodeSource;
// Joins a NodeSource up to the tree via the usual ExplorerExtender plumbing
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
    getChildren(kubectl, host, _parent) {
        return this.nodeSource.nodes(kubectl, host);
    }
}
exports.ContributedNodeSourceExtender = ContributedNodeSourceExtender;
//# sourceMappingURL=nodesources.js.map