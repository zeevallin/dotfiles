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
const path = require("path");
const vscode = require("vscode");
const imageToolRegistry_1 = require("./imageToolRegistry");
const kubeChannel_1 = require("../kubeChannel");
const shell_1 = require("../shell");
/**
 * Build the container image first. If imagePrefix is not empty, push the image to remote image registry, too.
 *
 * @param shellOpts any option available to Node.js's child_process.exec().
 * @param imagePrefix the image prefix for container images (e.g. 'docker.io/brendanburns').
 * @return the image name.
 */
function buildAndPushImage(shellOpts, imagePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const cwd = shellOpts.cwd || vscode.workspace.rootPath;
        const image = yield getDefaultImageName(cwd, imagePrefix);
        yield buildImage(image, shellOpts);
        if (imagePrefix) {
            yield pushImage(image, shellOpts);
        }
        return image;
    });
}
exports.buildAndPushImage = buildAndPushImage;
/**
 * Returns a promise that resolves to a command line for building the given image.
 * Rejects if couldn't get a command line.
 */
function getBuildCommand(image) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = yield imageToolRegistry_1.getCurrentBuildTool();
        return tool.getBuildCommand(image);
    });
}
exports.getBuildCommand = getBuildCommand;
/**
 * Returns a promise that resolves to a command line for pushing the given image.
 * Rejects if couldn't get a command line.
 */
function getPushCommand(image) {
    return __awaiter(this, void 0, void 0, function* () {
        const tool = yield imageToolRegistry_1.getCurrentBuildTool();
        return tool.getPushCommand(image);
    });
}
exports.getPushCommand = getPushCommand;
function sanitiseTag(name) {
    // Name components may contain lowercase letters, digits and separators.
    // A separator is defined as a period, one or two underscores, or one or
    // more dashes. A name component may not start or end with a separator.
    // https://docs.docker.com/engine/reference/commandline/tag/#extended-description
    return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}
function getDefaultImageName(cwd, imagePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = sanitiseTag(path.basename(cwd));
        const version = yield findVersion(cwd);
        let image = `${name}:${version}`;
        if (imagePrefix) {
            image = `${imagePrefix}/${image}`;
        }
        return image;
    });
}
function findVersion(cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        const shellOpts = Object.assign({}, shell_1.shell.execOpts(), { cwd });
        const shellResult = yield shell_1.shell.execCore('git describe --always --dirty', shellOpts);
        return shellResult.code === 0 ? shellResult.stdout.trim() : "latest";
    });
}
function buildImage(image, shellOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        const buildCommand = yield getBuildCommand(image);
        const result = yield shell_1.shell.execCore(buildCommand, shellOpts);
        if (result.code !== 0) {
            throw new Error(`Image build failed: ${result.stderr}`);
        }
        kubeChannel_1.kubeChannel.showOutput(image + ' built.');
    });
}
function pushImage(image, shellOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        const pushCommand = yield getPushCommand(image);
        const result = yield shell_1.shell.execCore(pushCommand, shellOpts);
        if (result.code !== 0) {
            throw new Error(`Image push failed: ${result.stderr}`);
        }
        kubeChannel_1.kubeChannel.showOutput(image + ' pushed.');
    });
}
//# sourceMappingURL=imageUtils.js.map