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
const shell_1 = require("../../shell");
const EXTENSION_CONFIG_KEY = "vs-kubernetes";
const KUBECONFIG_PATH_KEY = "vs-kubernetes.kubeconfig";
const KNOWN_KUBECONFIGS_KEY = "vs-kubernetes.knownKubeconfigs";
const KUBECTL_VERSIONING_KEY = "vs-kubernetes.kubectlVersioning";
var KubectlVersioning;
(function (KubectlVersioning) {
    KubectlVersioning[KubectlVersioning["UserProvided"] = 1] = "UserProvided";
    KubectlVersioning[KubectlVersioning["Infer"] = 2] = "Infer";
})(KubectlVersioning = exports.KubectlVersioning || (exports.KubectlVersioning = {}));
var LogsDisplay;
(function (LogsDisplay) {
    LogsDisplay[LogsDisplay["Webview"] = 1] = "Webview";
    LogsDisplay[LogsDisplay["Terminal"] = 2] = "Terminal";
})(LogsDisplay = exports.LogsDisplay || (exports.LogsDisplay = {}));
function addPathToConfig(configKey, value) {
    return __awaiter(this, void 0, void 0, function* () {
        yield setConfigValue(configKey, value);
    });
}
exports.addPathToConfig = addPathToConfig;
function setConfigValue(configKey, value) {
    return __awaiter(this, void 0, void 0, function* () {
        yield atAllConfigScopes(addValueToConfigAtScope, configKey, value);
    });
}
function addValueToConfigAtScope(configKey, value, scope, valueAtScope, createIfNotExist) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!createIfNotExist) {
            if (!valueAtScope || !(valueAtScope[configKey])) {
                return;
            }
        }
        let newValue = {};
        if (valueAtScope) {
            newValue = Object.assign({}, valueAtScope);
        }
        newValue[configKey] = value;
        yield vscode.workspace.getConfiguration().update(EXTENSION_CONFIG_KEY, newValue, scope);
    });
}
function addValueToConfigArray(configKey, value) {
    return __awaiter(this, void 0, void 0, function* () {
        yield atAllConfigScopes(addValueToConfigArrayAtScope, configKey, value);
    });
}
function addValueToConfigArrayAtScope(configKey, value, scope, valueAtScope, createIfNotExist) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!createIfNotExist) {
            if (!valueAtScope || !(valueAtScope[configKey])) {
                return;
            }
        }
        let newValue = {};
        if (valueAtScope) {
            newValue = Object.assign({}, valueAtScope);
        }
        const arrayEntry = newValue[configKey] || [];
        arrayEntry.push(value);
        newValue[configKey] = arrayEntry;
        yield vscode.workspace.getConfiguration().update(EXTENSION_CONFIG_KEY, newValue, scope);
    });
}
function atAllConfigScopes(fn, configKey, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = vscode.workspace.getConfiguration().inspect(EXTENSION_CONFIG_KEY);
        yield fn(configKey, value, vscode.ConfigurationTarget.Global, config.globalValue, true);
        yield fn(configKey, value, vscode.ConfigurationTarget.Workspace, config.workspaceValue, false);
        yield fn(configKey, value, vscode.ConfigurationTarget.WorkspaceFolder, config.workspaceFolderValue, false);
    });
}
// Functions for working with the list of known kubeconfigs
function getKnownKubeconfigs() {
    const kkcConfig = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[KNOWN_KUBECONFIGS_KEY];
    if (!kkcConfig || !kkcConfig.length) {
        return [];
    }
    return kkcConfig;
}
exports.getKnownKubeconfigs = getKnownKubeconfigs;
function addKnownKubeconfig(kubeconfigPath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield addValueToConfigArray(KNOWN_KUBECONFIGS_KEY, kubeconfigPath);
    });
}
exports.addKnownKubeconfig = addKnownKubeconfig;
// Functions for working with the active kubeconfig setting
function setActiveKubeconfig(kubeconfig) {
    return __awaiter(this, void 0, void 0, function* () {
        yield addPathToConfig(KUBECONFIG_PATH_KEY, kubeconfig);
    });
}
exports.setActiveKubeconfig = setActiveKubeconfig;
function getActiveKubeconfig() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[KUBECONFIG_PATH_KEY];
}
exports.getActiveKubeconfig = getActiveKubeconfig;
// Functions for working with tool paths
function getToolPath(host, shell, tool) {
    const baseKey = toolPathBaseKey(tool);
    return getPathSetting(host, shell, baseKey);
}
exports.getToolPath = getToolPath;
function getPathSetting(host, shell, baseKey) {
    const os = shell.platform();
    const osOverridePath = host.getConfiguration(EXTENSION_CONFIG_KEY)[osOverrideKey(os, baseKey)];
    return osOverridePath || host.getConfiguration(EXTENSION_CONFIG_KEY)[baseKey];
}
function toolPathBaseKey(tool) {
    return `vs-kubernetes.${tool}-path`;
}
exports.toolPathBaseKey = toolPathBaseKey;
function osOverrideKey(os, baseKey) {
    const osKey = osKeyString(os);
    return osKey ? `${baseKey}.${osKey}` : baseKey; // The 'else' clause should never happen so don't worry that this would result in double-checking a missing base key
}
function osKeyString(os) {
    switch (os) {
        case shell_1.Platform.Windows: return 'windows';
        case shell_1.Platform.MacOS: return 'mac';
        case shell_1.Platform.Linux: return 'linux';
        default: return null;
    }
}
function getKubectlVersioning() {
    const configValue = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[KUBECTL_VERSIONING_KEY];
    if (configValue === "infer") {
        return KubectlVersioning.Infer;
    }
    return KubectlVersioning.UserProvided;
}
exports.getKubectlVersioning = getKubectlVersioning;
// Auto cleanup on debug terminate
const AUTO_CLEANUP_DEBUG_KEY = "vs-kubernetes.autoCleanupOnDebugTerminate";
function getAutoCompleteOnDebugTerminate() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[AUTO_CLEANUP_DEBUG_KEY];
}
exports.getAutoCompleteOnDebugTerminate = getAutoCompleteOnDebugTerminate;
function setAlwaysCleanUp() {
    return __awaiter(this, void 0, void 0, function* () {
        yield setConfigValue(AUTO_CLEANUP_DEBUG_KEY, true);
    });
}
exports.setAlwaysCleanUp = setAlwaysCleanUp;
// Use WSL on Windows
const USE_WSL_KEY = "use-wsl";
function getUseWsl() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[USE_WSL_KEY];
}
exports.getUseWsl = getUseWsl;
// minikube check upgrade
const MK_CHECK_UPGRADE_KEY = 'checkForMinikubeUpgrade';
function getCheckForMinikubeUpgrade() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[MK_CHECK_UPGRADE_KEY];
}
exports.getCheckForMinikubeUpgrade = getCheckForMinikubeUpgrade;
// Other bits and bobs
function getOutputFormat() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.outputFormat'];
}
exports.getOutputFormat = getOutputFormat;
function getConfiguredNamespace() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.namespace'];
}
exports.getConfiguredNamespace = getConfiguredNamespace;
function affectsUs(change) {
    return change.affectsConfiguration(EXTENSION_CONFIG_KEY);
}
exports.affectsUs = affectsUs;
function getDisableLint() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['disable-lint'] === 'true';
}
exports.getDisableLint = getDisableLint;
function getDisabledLinters() {
    const config = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY);
    return config['disable-linters'] || [];
}
exports.getDisabledLinters = getDisabledLinters;
function logsDisplay() {
    const config = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY);
    return (config['logsDisplay'] === 'terminal') ? LogsDisplay.Terminal : LogsDisplay.Webview;
}
exports.logsDisplay = logsDisplay;
// nodejs debugger attach  options
// if true will try to automatically get the root location of the source code in the container
function getNodejsAutoDetectRemoteRoot() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.nodejs-autodetect-remote-root'];
}
exports.getNodejsAutoDetectRemoteRoot = getNodejsAutoDetectRemoteRoot;
// user specified root location of the source code in the container
function getNodejsRemoteRoot() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.nodejs-remote-root'];
}
exports.getNodejsRemoteRoot = getNodejsRemoteRoot;
// remote debugging port for nodejs. Usually 9229
function getNodejsDebugPort() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.nodejs-debug-port'];
}
exports.getNodejsDebugPort = getNodejsDebugPort;
// container image build tool
const IMAGE_BUILD_TOOL = "imageBuildTool";
function getImageBuildTool() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[IMAGE_BUILD_TOOL];
}
exports.getImageBuildTool = getImageBuildTool;
// if true will try to automatically get the root location of the source code in the container
function getPythonAutoDetectRemoteRoot() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.python-autodetect-remote-root'];
}
exports.getPythonAutoDetectRemoteRoot = getPythonAutoDetectRemoteRoot;
// user specified root location of the source code in the container
function getPythonRemoteRoot() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.python-remote-root'];
}
exports.getPythonRemoteRoot = getPythonRemoteRoot;
// remote debugging port for Python. Usually 5678
function getPythonDebugPort() {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)['vs-kubernetes.python-debug-port'];
}
exports.getPythonDebugPort = getPythonDebugPort;
//# sourceMappingURL=config.js.map