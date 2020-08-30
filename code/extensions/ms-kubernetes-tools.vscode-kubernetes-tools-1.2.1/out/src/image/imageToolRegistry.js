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
const binutil = require("../binutil");
const config_1 = require("../components/config/config");
const host_1 = require("../host");
const fs_1 = require("../fs");
const shell_1 = require("../shell");
function getCurrentBuildTool() {
    return __awaiter(this, void 0, void 0, function* () {
        const buildTool = supportedTools[config_1.getImageBuildTool()];
        if (!buildTool) {
            throw new Error(`Unknown image build tool: ${config_1.getImageBuildTool()}. Choose the correct value in 'vs-kubernetes.imageBuildTool' setting.`);
        }
        if (!(yield buildTool.checkPresent())) {
            throw new Error(`Could not find ${buildTool.binName} binary. Install it or choose another one in 'vs-kubernetes.imageBuildTool' setting.`);
        }
        return buildTool;
    });
}
exports.getCurrentBuildTool = getCurrentBuildTool;
class DockerLikeImageBuildTool {
    constructor(binName) {
        this.binName = binName;
        this.context = { host: host_1.host, fs: fs_1.fs, shell: shell_1.shell, binFound: false, binPath: binName };
    }
    getBuildCommand(image) {
        return `${this.binName} build -t ${image} .`;
    }
    getPushCommand(image) {
        return `${this.binName} push ${image}`;
    }
    checkPresent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context.binFound) {
                return true;
            }
            return binutil.checkForBinary(this.context, undefined, this.binName, '', '', false);
        });
    }
}
class Buildah extends DockerLikeImageBuildTool {
    getBuildCommand(image) {
        return `${this.binName} bud -t ${image} .`;
    }
}
const supportedTools = {
    Docker: new DockerLikeImageBuildTool('docker'),
    Buildah: new Buildah('buildah')
};
//# sourceMappingURL=imageToolRegistry.js.map