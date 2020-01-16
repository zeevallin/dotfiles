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
const v1_1 = require("./v1");
class CustomNode {
    constructor(impl) {
        this.impl = impl;
        this.nodeCategory = 'kubernetes-explorer-node';
        this.nodeType = 'extension';
        this.id = 'dummy';
    }
    getChildren(_kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.impl.getChildren()).map((n) => v1_1.internalNodeOf(n));
        });
    }
    getTreeItem() {
        return this.impl.getTreeItem();
    }
}
exports.CustomNode = CustomNode;
//# sourceMappingURL=ContributedNode.js.map