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
const kubeChannel_1 = require("../kubeChannel");
const binutilplusplus_1 = require("../binutilplusplus");
const extensionUtils = require("../extensionUtils");
const debugUtils = require("./debugUtils");
const debuggerType = 'nodejs';
class NodejsDebugProvider {
    getDebuggerType() {
        return debuggerType;
    }
    isDebuggerInstalled() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    startDebugging(workspaceFolder, sessionName, port, _pod, _pidToDebug) {
        return __awaiter(this, void 0, void 0, function* () {
            const debugConfiguration = {
                type: "node",
                request: "attach",
                name: sessionName,
                hostName: "localhost",
                skipFiles: [
                    "<node_internals>/**/*.js"
                ],
                port
            };
            if (this.remoteRoot) {
                debugConfiguration['remoteRoot'] = this.remoteRoot;
            }
            const currentFolder = (vscode.workspace.workspaceFolders || []).find((folder) => folder.name === path.basename(workspaceFolder));
            return yield vscode.debug.startDebugging(currentFolder, debugConfiguration);
        });
    }
    isSupportedImage() {
        return false;
    }
    resolvePortsFromFile(dockerfile, env) {
        return __awaiter(this, void 0, void 0, function* () {
            this.remoteRoot = dockerfile.getWorkDir();
            const possiblePorts = dockerfile.getExposedPorts();
            if (!extensionUtils.isNonEmptyArray(possiblePorts)) { // Enable debug options in command lines directly.
                return undefined;
            }
            const rawDebugPortInfo = config.getNodejsDebugPort() || 9229;
            const rawAppPortInfo = yield debugUtils.promptForAppPort(possiblePorts, '8080', env);
            return {
                debugPort: Number(rawDebugPortInfo),
                appPort: Number(rawAppPortInfo)
            };
        });
    }
    resolvePortsFromContainer(kubectl, pod, podNamespace, container) {
        return __awaiter(this, void 0, void 0, function* () {
            this.shell = yield container_shell_1.suggestedShellForContainer(kubectl, pod, podNamespace, container);
            const inspectModeResult = yield this.setNodeInspectMode(kubectl, pod, podNamespace, container);
            if (!inspectModeResult) {
                kubeChannel_1.kubeChannel.showOutput('Unable to set Node.js in the container to inspect mode.');
                return undefined;
            }
            this.remoteRoot = yield this.tryGetRemoteRoot(kubectl, pod, podNamespace, container);
            const rawDebugPortInfo = config.getNodejsDebugPort() || 9229;
            return {
                debugPort: Number(rawDebugPortInfo)
            };
        });
    }
    setNodeInspectMode(kubectl, pod, podNamespace, container) {
        return __awaiter(this, void 0, void 0, function* () {
            kubeChannel_1.kubeChannel.showOutput('Switching node to debug mode in container');
            const nsarg = podNamespace ? `--namespace ${podNamespace}` : '';
            // sending SIGUSR1 to a Node.js process will set it in debug (inspect) mode. See https://nodejs.org/en/docs/guides/debugging-getting-started/#enable-inspector
            const containerCommand = container ? `-c ${container}` : '';
            const execCmd = `exec ${pod} ${nsarg} ${containerCommand} -- ${this.shell} -c "kill -s USR1 1"`;
            const execResult = yield kubectl.invokeCommand(execCmd);
            return binutilplusplus_1.ExecResult.succeeded(execResult);
        });
    }
    tryGetRemoteRoot(kubectl, podName, podNamespace, containerName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (config.getNodejsAutoDetectRemoteRoot()) {
                kubeChannel_1.kubeChannel.showOutput("Trying to detect remote root.");
                const nsarg = podNamespace ? `--namespace ${podNamespace}` : '';
                const containerCommand = containerName ? `-c ${containerName}` : '';
                const execCmd = `exec ${podName} ${nsarg} ${containerCommand} -- ${this.shell} -c "readlink /proc/1/cwd"`;
                const execResult = yield kubectl.invokeCommand(execCmd);
                if (binutilplusplus_1.ExecResult.succeeded(execResult)) {
                    const remoteRoot = execResult.stdout.replace(/(\r\n|\n|\r)/gm, '');
                    kubeChannel_1.kubeChannel.showOutput(`Got remote root from container: ${remoteRoot}`);
                    return remoteRoot;
                }
            }
            if (config.getNodejsRemoteRoot()) {
                const remoteRoot = config.getNodejsRemoteRoot();
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
            const debugCommand = yield vscode.window.showInputBox({
                prompt: 'Command to enable inspector in your container for debugging.',
                placeHolder: 'Example: node --inspect app.js'
            });
            if (!debugCommand) {
                return { cancelled: true };
            }
            return { cancelled: false, value: `-i --attach=false -- ${debugCommand}` };
        });
    }
}
exports.NodejsDebugProvider = NodejsDebugProvider;
//# sourceMappingURL=nodejsDebugProvider.js.map