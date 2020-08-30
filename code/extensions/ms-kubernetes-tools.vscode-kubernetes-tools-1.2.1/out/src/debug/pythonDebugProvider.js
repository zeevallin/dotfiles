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
const container_shell_1 = require("../utils/container-shell");
const config = require("../components/config/config");
const extensionUtils = require("../extensionUtils");
const kubeChannel_1 = require("../kubeChannel");
const binutilplusplus_1 = require("../binutilplusplus");
const debuggerType = 'python';
const defaultPythonDebuggerExtensionId = 'ms-python.python';
class PythonDebugProvider {
    getDebuggerType() {
        return debuggerType;
    }
    isDebuggerInstalled() {
        return __awaiter(this, void 0, void 0, function* () {
            if (vscode.extensions.getExtension(defaultPythonDebuggerExtensionId)) {
                return true;
            }
            const answer = yield vscode.window.showInformationMessage(`Python debugging requires the '${defaultPythonDebuggerExtensionId}' extension. Would you like to install it now?`, "Install Now");
            if (answer === "Install Now") {
                return yield extensionUtils.installVscodeExtension(defaultPythonDebuggerExtensionId);
            }
            return false;
        });
    }
    startDebugging(workspaceFolder, sessionName, port, _pod, _pidToDebug) {
        return __awaiter(this, void 0, void 0, function* () {
            const debugConfiguration = {
                type: "python",
                request: "attach",
                name: sessionName,
                hostName: "localhost",
                port
            };
            const currentFolder = (vscode.workspace.workspaceFolders || []).find((folder) => folder.name === path.basename(workspaceFolder));
            if (currentFolder && this.remoteRoot) {
                debugConfiguration['pathMappings'] = [{
                        localRoot: workspaceFolder,
                        remoteRoot: this.remoteRoot
                    }];
            }
            return yield vscode.debug.startDebugging(currentFolder, debugConfiguration);
        });
    }
    isSupportedImage(baseImage) {
        if (!baseImage) {
            return false;
        }
        return baseImage.indexOf("python") >= 0;
    }
    resolvePortsFromFile() {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    resolvePortsFromContainer(kubectl, pod, podNamespace, container) {
        return __awaiter(this, void 0, void 0, function* () {
            this.shell = yield container_shell_1.suggestedShellForContainer(kubectl, pod, podNamespace, container);
            this.remoteRoot = yield this.tryGetRemoteRoot(kubectl, pod, podNamespace, container);
            const rawDebugPortInfo = config.getPythonDebugPort() || 5678;
            return {
                debugPort: Number(rawDebugPortInfo)
            };
        });
    }
    tryGetRemoteRoot(kubectl, podName, podNamespace, containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config.getPythonAutoDetectRemoteRoot()) {
                kubeChannel_1.kubeChannel.showOutput("Trying to detect remote root.");
                const nsarg = podNamespace ? `--namespace ${podNamespace}` : '';
                const containerCommand = containerName ? `-c ${containerName}` : '';
                const execCmd = `exec ${podName} ${nsarg} ${containerCommand} -- ${this.shell} -c 'readlink /proc/1/cwd'`;
                const execResult = yield kubectl.invokeCommand(execCmd);
                if (binutilplusplus_1.ExecResult.succeeded(execResult)) {
                    const remoteRoot = execResult.stdout.replace(/(\r\n|\n|\r)/gm, '');
                    kubeChannel_1.kubeChannel.showOutput(`Got remote root from container: ${remoteRoot}`);
                    return remoteRoot;
                }
            }
            if (config.getPythonRemoteRoot()) {
                const remoteRoot = config.getPythonRemoteRoot();
                kubeChannel_1.kubeChannel.showOutput(`Setting remote root to ${remoteRoot}`);
                return remoteRoot;
            }
            return undefined;
        });
    }
    filterSupportedProcesses(_processes) {
        return undefined;
    }
    isPortRequired() {
        return true;
    }
    getDebugArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            return { cancelled: false };
        });
    }
}
exports.PythonDebugProvider = PythonDebugProvider;
//# sourceMappingURL=pythonDebugProvider.js.map