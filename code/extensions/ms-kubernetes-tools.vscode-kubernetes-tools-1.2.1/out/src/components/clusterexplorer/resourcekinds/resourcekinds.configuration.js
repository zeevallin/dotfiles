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
const node_resource_1 = require("../node.resource");
const node_configurationvalue_1 = require("../node.configurationvalue");
exports.configItemsChildSource = {
    children(_kubectl, parent) {
        return __awaiter(this, void 0, void 0, function* () {
            const configData = parent.extraInfo.configData; // TODO: unbang
            if (!configData || configData.length === 0) {
                return [];
            }
            const files = Object.keys(configData);
            return files.map((f) => new node_configurationvalue_1.ConfigurationValueNode(configData, f, parent.kind, parent.name));
        });
    }
};
exports.configResourceLister = {
    list(kubectl, kind) {
        return __awaiter(this, void 0, void 0, function* () {
            const resources = yield kubectlUtils.getAsDataResources(kind.abbreviation, kubectl);
            return resources.map((r) => node_resource_1.ResourceNode.create(kind, r.metadata.name, r.metadata, { configData: r.data }));
        });
    }
};
//# sourceMappingURL=resourcekinds.configuration.js.map