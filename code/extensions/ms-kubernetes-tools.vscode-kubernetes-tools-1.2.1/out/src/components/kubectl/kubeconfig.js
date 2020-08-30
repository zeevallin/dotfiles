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
const vscode = require("vscode");
const fs_1 = require("../../fs");
const path = require("path");
const yaml = require("js-yaml");
const shelljs = require("shelljs");
const explorer_1 = require("../clusterprovider/common/explorer");
const config_1 = require("../config/config");
const kubernetes = require("@kubernetes/client-node");
const mkdirp_1 = require("../../utils/mkdirp");
function loadKubeconfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeconfig = new kubernetes.KubeConfig();
        const kubeconfigPath = getKubeconfigPath();
        if (kubeconfigPath.pathType === 'host') {
            kubeconfig.loadFromFile(kubeconfigPath.hostPath);
        }
        else if (kubeconfigPath.pathType === 'wsl') {
            const result = shelljs.exec(`wsl.exe sh -c "cat ${kubeconfigPath.wslPath}"`, { silent: true });
            if (!result) {
                throw new Error(`Impossible to retrieve the kubeconfig content from WSL at path '${kubeconfigPath.wslPath}'. No result from the shelljs.exe call.`);
            }
            if (result.code !== 0) {
                throw new Error(`Impossible to retrieve the kubeconfig content from WSL at path '${kubeconfigPath.wslPath}. Error code: ${result.code}. Error output: ${result.stderr.trim()}`);
            }
            kubeconfig.loadFromString(result.stdout.trim());
        }
        else {
            throw new Error(`Kubeconfig path type is not recognized.`);
        }
        return kubeconfig;
    });
}
exports.loadKubeconfig = loadKubeconfig;
function getKubeconfigPath() {
    // If the user specified a kubeconfig path -WSL or not-, let's use it.
    let kubeconfigPath = config_1.getActiveKubeconfig();
    if (config_1.getUseWsl()) {
        if (!kubeconfigPath) {
            // User is using WSL: we want to use the same default that kubectl uses on Linux ($KUBECONFIG or home directory).
            const result = shelljs.exec('wsl.exe sh -c "${KUBECONFIG:-$HOME/.kube/config}"', { silent: true });
            if (!result) {
                throw new Error(`Impossible to retrieve the kubeconfig path from WSL. No result from the shelljs.exe call.`);
            }
            if (result.code !== 0) {
                throw new Error(`Impossible to retrieve the kubeconfig path from WSL. Error code: ${result.code}. Error output: ${result.stderr.trim()}`);
            }
            kubeconfigPath = result.stdout.trim();
        }
        return {
            pathType: 'wsl',
            wslPath: kubeconfigPath
        };
    }
    if (!kubeconfigPath) {
        kubeconfigPath = process.env['KUBECONFIG'];
    }
    if (!kubeconfigPath) {
        // Fall back on the default kubeconfig value.
        kubeconfigPath = path.join((process.env['HOME'] || process.env['USERPROFILE'] || '.'), ".kube", "config");
    }
    return {
        pathType: 'host',
        hostPath: kubeconfigPath
    };
}
exports.getKubeconfigPath = getKubeconfigPath;
function mergeToKubeconfig(newConfigText) {
    return __awaiter(this, void 0, void 0, function* () {
        const kubeconfigPath = getKubeconfigPath();
        if (kubeconfigPath.pathType === 'wsl') {
            vscode.window.showErrorMessage("You are on Windows, but are using WSL-based tools. We can't merge into your WSL kubeconfig. Consider running VS Code in WSL using the Remote Extensions.");
            return;
        }
        const kcfile = kubeconfigPath.hostPath;
        const kcfileExists = yield fs_1.fs.existsAsync(kcfile);
        const kubeconfigText = kcfileExists ? yield fs_1.fs.readTextFile(kcfile) : '';
        const kubeconfig = yaml.safeLoad(kubeconfigText) || {};
        const newConfig = yaml.safeLoad(newConfigText);
        for (const section of ['clusters', 'contexts', 'users']) {
            const existing = kubeconfig[section];
            const toMerge = newConfig[section];
            if (!toMerge) {
                continue;
            }
            if (!existing) {
                kubeconfig[section] = toMerge;
                continue;
            }
            yield mergeInto(existing, toMerge);
        }
        if (!kcfileExists && newConfig.contexts && newConfig.contexts[0]) {
            kubeconfig['current-context'] = newConfig.contexts[0].name;
        }
        const merged = yaml.safeDump(kubeconfig, { lineWidth: 1000000, noArrayIndent: true });
        if (kcfileExists) {
            const backupFile = kcfile + '.vscode-k8s-tools-backup';
            if (yield fs_1.fs.existsAsync(backupFile)) {
                yield fs_1.fs.unlinkAsync(backupFile);
            }
            yield fs_1.fs.renameAsync(kcfile, backupFile);
        }
        else {
            yield mkdirp_1.mkdirpAsync(path.dirname(kcfile));
        }
        yield fs_1.fs.writeTextFile(kcfile, merged);
        yield explorer_1.refreshExplorer();
        yield vscode.window.showInformationMessage(`New configuration merged to ${kcfile}`);
    });
}
exports.mergeToKubeconfig = mergeToKubeconfig;
function mergeInto(existing, toMerge) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const toMergeEntry of toMerge) {
            if (existing.some((e) => e.name === toMergeEntry.name)) {
                // we have CONFLICT and CONFLICT BUILDS CHARACTER
                yield vscode.window.showWarningMessage(`${toMergeEntry.name} already exists - skipping`);
                continue; // TODO: build character
            }
            existing.push(toMergeEntry);
        }
    });
}
//# sourceMappingURL=kubeconfig.js.map