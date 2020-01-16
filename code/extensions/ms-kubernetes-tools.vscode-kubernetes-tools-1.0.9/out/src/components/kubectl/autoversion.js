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
const sha256 = require("fast-sha256");
const download = require("../download/download");
const shell_1 = require("../../shell");
const fs_1 = require("../../fs");
const kubectlUtils_1 = require("../../kubectlUtils");
const errorable_1 = require("../../errorable");
const filebacked_1 = require("../../utils/filebacked");
const config_1 = require("../config/config");
const mkdirp_1 = require("../../utils/mkdirp");
const installationlayout_1 = require("../installer/installationlayout");
const AUTO_VERSION_CACHE_FILE = getCachePath(shell_1.shell); // TODO: awkward that we're using a hardwired shell here but parameterising it elsewhere
const AUTO_VERSION_CACHE = new filebacked_1.FileBacked(fs_1.fs, AUTO_VERSION_CACHE_FILE, defaultClusterVersionCache);
function ensureSuitableKubectl(kubectl, shell, host) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield fs_1.fs.existsAsync(getBasePath(shell)))) {
            yield mkdirp_1.mkdirpAsync(getBasePath(shell));
        }
        const context = yield kubectlUtils_1.getCurrentContext(kubectl);
        if (!context) {
            return undefined;
        }
        const serverVersion = yield getServerVersion(kubectl, context.contextName);
        if (!serverVersion) {
            return undefined;
        }
        if (!(yield gotKubectlVersion(shell, serverVersion))) {
            const downloaded = yield downloadKubectlVersion(shell, host, serverVersion);
            if (!downloaded) {
                return undefined;
            }
        }
        return kubectlVersionPath(shell, serverVersion);
    });
}
exports.ensureSuitableKubectl = ensureSuitableKubectl;
function getBasePath(shell) {
    return path.join(shell.home(), `.vs-kubernetes/tools/kubectl/autoversion`);
}
function getCachePath(shell) {
    return path.join(getBasePath(shell), `cache.json`);
}
function gotKubectlVersion(shell, serverVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const binPath = kubectlVersionPath(shell, serverVersion);
        if (!binPath) {
            return true; // if we can't place the binary, there's no point downloading it
        }
        return yield fs_1.fs.existsAsync(binPath);
    });
}
// TODO: deduplicate with installer.ts
function downloadKubectlVersion(shell, host, serverVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const binPath = kubectlVersionPath(shell, serverVersion);
        if (!binPath) {
            return false;
        }
        const os = installationlayout_1.platformUrlString(shell.platform());
        const binFile = (shell.isUnix()) ? 'kubectl' : 'kubectl.exe';
        const kubectlUrl = `https://storage.googleapis.com/kubernetes-release/release/${serverVersion}/bin/${os}/amd64/${binFile}`;
        // TODO: this feels a bit ugly and over-complicated - should perhaps be up to download.once to manage
        // showing the progress UI so we don't need all the operationKey mess
        const downloadResult = yield host.longRunning({ title: `Downloading kubectl ${serverVersion}`, operationKey: binPath }, () => download.once(kubectlUrl, binPath));
        if (shell.isUnix()) {
            yield fs_1.fs.chmod(binPath, '0755');
        }
        return errorable_1.succeeded(downloadResult);
    });
}
function kubectlVersionPath(shell, serverVersion) {
    const platform = shell.platform();
    const binPath = installationlayout_1.formatBin('kubectl', platform);
    if (!binPath) {
        return undefined; // should never happen
    }
    return path.join(getBasePath(shell), serverVersion, binPath);
}
function ensureCacheIsForCurrentKubeconfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeconfigHashText = yield getKubeconfigPathHash();
        if (!kubeconfigHashText) {
            AUTO_VERSION_CACHE.update({ derivedFromKubeconfig: undefined, versions: {} });
            return;
        }
        const cacheKubeconfigHashText = (yield AUTO_VERSION_CACHE.get()).derivedFromKubeconfig;
        if (kubeconfigHashText !== cacheKubeconfigHashText) {
            AUTO_VERSION_CACHE.update({ derivedFromKubeconfig: kubeconfigHashText, versions: {} });
        }
    });
}
function getKubeconfigPathHash() {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeconfigPath = config_1.getActiveKubeconfig() || process.env['KUBECONFIG'] || path.join(shell_1.shell.home(), '.kube/config');
        if (!(yield fs_1.fs.existsAsync(kubeconfigPath))) {
            return undefined;
        }
        const kubeconfigPathHash = sha256.hash(Buffer.from(kubeconfigPath));
        const kubeconfigHashText = hashToString(kubeconfigPathHash);
        return kubeconfigHashText;
    });
}
function hashToString(hash) {
    return Buffer.from(hash).toString('hex');
}
function getServerVersion(kubectl, context) {
    return __awaiter(this, void 0, void 0, function* () {
        yield ensureCacheIsForCurrentKubeconfig();
        const cachedVersions = yield AUTO_VERSION_CACHE.get();
        if (cachedVersions.versions[context]) {
            return cachedVersions.versions[context];
        }
        const sr = yield kubectl.invokeAsync('version -o json');
        if (sr && sr.code === 0) {
            const versionInfo = JSON.parse(sr.stdout);
            if (versionInfo && versionInfo.serverVersion) {
                const serverVersion = versionInfo.serverVersion.gitVersion;
                cachedVersions.versions[context] = serverVersion;
                yield AUTO_VERSION_CACHE.update(cachedVersions);
                return serverVersion;
            }
        }
        return undefined;
    });
}
function defaultClusterVersionCache() {
    return { derivedFromKubeconfig: undefined, versions: {} };
}
//# sourceMappingURL=autoversion.js.map