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
const kubectlUtils = require("../../../kubectlUtils");
const kuberesources = require("../../../kuberesources");
const node_resource_1 = require("../node.resource");
exports.nodePodsChildSource = {
    children(kubectl, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            const pods = yield kubectlUtils.getPods(kubectl, null, 'all');
            const filteredPods = pods.filter((p) => `node/${p.nodeName}` === parent.kindName);
            return filteredPods.map((p) => node_resource_1.ResourceNode.create(kuberesources.allKinds.pod, p.name, p.metadata, { podInfo: p }));
        });
    }
};
//# sourceMappingURL=resourcekind.node.js.map