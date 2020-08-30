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
const extensionUtils = require("../extensionUtils");
const kubeChannel_1 = require("../kubeChannel");
const extensionConfig = require("../components/config/config");
// Use the csharp debugger extension provided by Microsoft for csharp debugging.
const defaultDotnetDebuggerExtensionId = "ms-dotnettools.csharp";
const defaultDotnetDebuggerExtension = "C# for Visual Studio Code";
const defaultDotnetDebuggerConfigType = "dotnet";
class DotNetDebugProvider {
    getDebuggerType() {
        return defaultDotnetDebuggerConfigType;
    }
    isDebuggerInstalled() {
        return __awaiter(this, void 0, void 0, function* () {
            if (vscode.extensions.getExtension(defaultDotnetDebuggerExtensionId)) {
                return true;
            }
            const answer = yield vscode.window.showInformationMessage(`Dotnet debugging requires the '${defaultDotnetDebuggerExtension}' extension. Would you like to install it now?`, "Install Now");
            if (answer === "Install Now") {
                return yield extensionUtils.installVscodeExtension(defaultDotnetDebuggerExtensionId);
            }
            return false;
        });
    }
    startDebugging(workspaceFolder, _sessionName, _port, pod, pidToDebug) {
        return __awaiter(this, void 0, void 0, function* () {
            const processId = pidToDebug ? pidToDebug.toString() : "${command:pickRemoteProcess}";
            const debugConfiguration = {
                name: ".NET Core Kubernetes Attach",
                type: "coreclr",
                request: "attach",
                processId: processId,
                pipeTransport: {
                    pipeProgram: "kubectl",
                    pipeArgs: ["exec", "-i", pod, "--"],
                    debuggerPath: "/vsdbg/vsdbg",
                    pipeCwd: workspaceFolder,
                    quoteArgs: false
                }
            };
            const map = extensionConfig.getDotnetDebugSourceFileMap();
            if (map) {
                try {
                    const json = `{"${map.replace(/\\/g, "\\\\")}":"${workspaceFolder.replace(/\\/g, "\\\\")}"}`;
                    const sourceFileMap = JSON.parse(json);
                    debugConfiguration['sourceFileMap'] = sourceFileMap;
                }
                catch (error) {
                    kubeChannel_1.kubeChannel.showOutput(error.message);
                }
            }
            const currentFolder = (vscode.workspace.workspaceFolders || []).find((folder) => folder.name === path.basename(workspaceFolder));
            const result = yield vscode.debug.startDebugging(currentFolder, debugConfiguration);
            if (!result) {
                kubeChannel_1.kubeChannel.showOutput(`${defaultDotnetDebuggerConfigType} debug attach failed for pod ${pod}.\nSee https://github.com/Azure/vscode-kubernetes-tools/blob/master/debug-on-kubernetes.md for troubleshooting.`, "Failed to attach");
            }
            return result;
        });
    }
    isSupportedImage(_baseImage) {
        // todo: add support for debug from file
        return false;
    }
    resolvePortsFromFile(_dockerfile, _env) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    resolvePortsFromContainer(_kubectl, _pod, _podNamespace, _container) {
        return __awaiter(this, void 0, void 0, function* () {
            return undefined;
        });
    }
    filterSupportedProcesses(processes) {
        return processes.filter((processInfo) => (processInfo.command.toLowerCase().startsWith('dotnet ') ||
            processInfo.command.indexOf('/dotnet ') >= 0)); // full path
    }
    isPortRequired() {
        return false;
    }
    getDebugArgs() {
        return __awaiter(this, void 0, void 0, function* () {
            return { cancelled: false };
        });
    }
}
exports.DotNetDebugProvider = DotNetDebugProvider;
//# sourceMappingURL=dotNetDebugProvider.js.map