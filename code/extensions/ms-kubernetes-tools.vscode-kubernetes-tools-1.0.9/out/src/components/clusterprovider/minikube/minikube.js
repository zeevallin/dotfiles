'use strict';
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
const binutil = require("../../../binutil");
const errorable_1 = require("../../../errorable");
const wizard_1 = require("../../../wizard");
const config_1 = require("../../config/config");
const installer_1 = require("../../installer/installer");
class MinikubeInfo {
}
exports.MinikubeInfo = MinikubeInfo;
class MinikubeVersionInfo {
}
exports.MinikubeVersionInfo = MinikubeVersionInfo;
class MinikubeOptions {
}
exports.MinikubeOptions = MinikubeOptions;
function create(host, fs, shell, installDependenciesCallback) {
    return new MinikubeImpl(host, fs, shell, installDependenciesCallback, false);
}
exports.create = create;
// TODO: these are the same as we are using for Draft (and kubectl?) -
// we really need to unify them (and the designs).
var CheckPresentMode;
(function (CheckPresentMode) {
    CheckPresentMode[CheckPresentMode["Alert"] = 0] = "Alert";
    CheckPresentMode[CheckPresentMode["Silent"] = 1] = "Silent";
})(CheckPresentMode = exports.CheckPresentMode || (exports.CheckPresentMode = {}));
class MinikubeImpl {
    constructor(host, fs, shell, installDependenciesCallback, toolFound) {
        this.context = { host: host, fs: fs, shell: shell, installDependenciesCallback: installDependenciesCallback, binFound: toolFound, binPath: 'minikube' };
    }
    checkPresent(mode) {
        return checkPresent(this.context, mode);
    }
    isRunnable() {
        return isRunnableMinikube(this.context);
    }
    start(options) {
        return startMinikube(this.context, options);
    }
    stop() {
        return stopMinikube(this.context);
    }
    status() {
        return minikubeStatus(this.context);
    }
    checkUpgradeAvailable() {
        return minikubeUpgradeAvailable(this.context);
    }
}
function getVersionInfo(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield context.shell.exec(`"${context.binPath}" update-check`);
        if (!sr || sr.code !== 0) {
            throw new Error(`Error checking for minikube updates: ${sr ? sr.stderr : 'cannot run minikube'}`);
        }
        const lines = sr.stdout.split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        if (lines.length !== 2) {
            throw new Error(`Unexpected output for minikube version check: ${lines}`);
        }
        const currentVersion = extractVersion(lines[0]);
        const availableVersion = extractVersion(lines[1]);
        if (currentVersion === null || availableVersion === null) {
            throw new Error(`Unable to get version from minikube version check: ${lines}`);
        }
        return {
            currentVersion: currentVersion,
            availableVersion: availableVersion
        };
    });
}
function minikubeUpgradeAvailable(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const performUpgradeCheck = (yield checkPresent(context, CheckPresentMode.Silent)) && config_1.getCheckForMinikubeUpgrade();
        if (!performUpgradeCheck) {
            return;
        }
        let versionInfo;
        try {
            versionInfo = yield getVersionInfo(context);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Failed to determine minikube version: ${err}`);
            return;
        }
        if (versionInfo.currentVersion !== versionInfo.availableVersion) {
            const value = yield vscode.window.showInformationMessage(`Minikube upgrade available to ${versionInfo.availableVersion}, currently on ${versionInfo.currentVersion}`, 'Install');
            if (value === 'Install') {
                const result = yield installer_1.installMinikube(context.shell, versionInfo.availableVersion);
                if (errorable_1.failed(result)) {
                    vscode.window.showErrorMessage(`Failed to update minikube: ${result.error}`);
                }
            }
        }
    });
}
function extractVersion(line) {
    const parts = line.split(': ');
    return parts[1];
}
function isRunnableMinikube(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield checkPresent(context, CheckPresentMode.Alert))) {
            return { succeeded: false, error: ['Minikube is not installed'] };
        }
        const sr = yield context.shell.exec(`"${context.binPath}" help`);
        return wizard_1.fromShellExitCodeOnly(sr, "Unable to run Minikube");
    });
}
let minikubeStatusBarItem;
function getStatusBar() {
    if (!minikubeStatusBarItem) {
        minikubeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }
    return minikubeStatusBarItem;
}
function startMinikube(context, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield checkPresent(context, CheckPresentMode.Alert))) {
            return;
        }
        const item = getStatusBar();
        item.text = 'minikube-starting';
        item.show();
        const status = yield minikubeStatus(context);
        if (status.running) {
            vscode.window.showWarningMessage('Minikube cluster is already started.');
            return;
        }
        let flags = options.additionalFlags ? options.additionalFlags : '';
        if (options.vmDriver && options.vmDriver.length > 0) {
            flags += ` --vm-driver=${options.vmDriver} `;
        }
        context.shell.exec(`"${context.binPath}" ${flags} start`).then((result) => {
            if (result && result.code === 0) {
                vscode.window.showInformationMessage('Cluster started.');
                item.text = 'minikube-running';
            }
            else {
                vscode.window.showErrorMessage(`Failed to start cluster ${result ? result.stderr : "Unable to run Minikube"}`);
                item.hide();
            }
        }).catch((err) => {
            item.hide();
            vscode.window.showErrorMessage(`Failed to start cluster: ${err}`);
        });
    });
}
function stopMinikube(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield checkPresent(context, CheckPresentMode.Alert))) {
            return;
        }
        const item = getStatusBar();
        item.text = 'minikube-stopping';
        item.show();
        const status = yield minikubeStatus(context);
        if (!status.running) {
            vscode.window.showWarningMessage('Minikube cluster is already stopped.');
            return;
        }
        context.shell.exec(`"${context.binPath}" stop`).then((result) => {
            if (result && result.code === 0) {
                vscode.window.showInformationMessage('Cluster stopped.');
                item.hide();
            }
            else {
                vscode.window.showErrorMessage(`Error stopping cluster ${result ? result.stderr : "Unable to run Minikube"}`);
                item.hide();
            }
        }).catch((err) => {
            vscode.window.showErrorMessage(`Error stopping cluster: ${err}`);
            item.hide();
        });
    });
}
function minikubeStatus(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield checkPresent(context, CheckPresentMode.Silent))) {
            throw new Error('Minikube executable could not be found!');
        }
        const result = yield context.shell.exec(`"${context.binPath}" status`);
        if (result && result.stderr.length === 0) {
            const hostStatus = result.stdout.split('\n')[0].split(': ')[1].toLowerCase();
            return {
                running: 'stopped' !== hostStatus,
                message: `${result.stdout}`
            };
        }
        throw new Error(`Failed to get status: ${result ? result.stderr : "Unable to run Minikube"}`);
    });
}
function checkPresent(context, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (context.binFound) {
            return true;
        }
        return yield checkForMinikubeInternal(context, mode);
    });
}
function checkForMinikubeInternal(context, mode) {
    return __awaiter(this, void 0, void 0, function* () {
        const binName = 'minikube';
        const bin = config_1.getToolPath(context.host, context.shell, binName);
        const inferFailedMessage = `Could not find "${binName}" binary.`;
        const configuredFileMissingMessage = `${bin} does not exist!`;
        return binutil.checkForBinary(context, bin, binName, inferFailedMessage, configuredFileMissingMessage, mode === CheckPresentMode.Alert);
    });
}
//# sourceMappingURL=minikube.js.map