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
const errorable_1 = require("../../errorable");
const node_message_1 = require("./node.message");
const node_helmrelease_1 = require("./node.helmrelease");
const node_folder_grouping_1 = require("./node.folder.grouping");
const helmexec = require("../../helm.exec");
class HelmReleasesFolder extends node_folder_grouping_1.GroupingFolderNode /* TODO: not really */ {
    constructor() {
        super("Helm Release", "Helm Releases", "vsKubernetes.nonResourceFolder"); // TODO: folder.grouping is not quite right... but...
    }
    getChildren(kubectl, _host) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!helmexec.ensureHelm(helmexec.EnsureMode.Silent)) {
                return [new node_message_1.MessageNode("Helm client is not installed")];
            }
            const currentNS = yield kubectlUtils.currentNamespace(kubectl);
            const releases = yield helmexec.helmListAll(currentNS);
            if (errorable_1.failed(releases)) {
                return [new node_message_1.MessageNode("Helm list error", releases.error[0])];
            }
            return releases.result.map((r) => new node_helmrelease_1.HelmReleaseNode(r.name, r.status));
        });
    }
}
exports.HelmReleasesFolder = HelmReleasesFolder;
//# sourceMappingURL=node.folder.helmreleases.js.map