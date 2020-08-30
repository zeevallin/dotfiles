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
const dotNetDebugProvider_1 = require("./dotNetDebugProvider");
const javaDebugProvider_1 = require("./javaDebugProvider");
const nodejsDebugProvider_1 = require("./nodejsDebugProvider");
const pythonDebugProvider_1 = require("./pythonDebugProvider");
const supportedProviders = [
    new dotNetDebugProvider_1.DotNetDebugProvider(),
    new javaDebugProvider_1.JavaDebugProvider(),
    new nodejsDebugProvider_1.NodejsDebugProvider(),
    new pythonDebugProvider_1.PythonDebugProvider()
];
function showProviderPick(providers) {
    return __awaiter(this, void 0, void 0, function* () {
        const providerItems = providers.map((provider) => {
            return {
                label: provider.getDebuggerType(),
                description: "",
                provider
            };
        });
        const pickedProvider = yield vscode.window.showQuickPick(providerItems, { placeHolder: "Select the environment" });
        if (!pickedProvider) {
            return undefined;
        }
        return pickedProvider.provider;
    });
}
function getDebugProvider(baseImage, runningProcesses) {
    return __awaiter(this, void 0, void 0, function* () {
        let debugProvider = null;
        if (baseImage) {
            debugProvider = supportedProviders.find((provider) => provider.isSupportedImage(baseImage));
        }
        if (!debugProvider) {
            let candidateProviders;
            if (runningProcesses) {
                candidateProviders = [];
                for (const provider of supportedProviders) {
                    const filteredProcesses = provider.filterSupportedProcesses(runningProcesses);
                    if (!filteredProcesses || filteredProcesses.length > 0) {
                        candidateProviders.push(provider);
                    }
                }
            }
            else {
                candidateProviders = supportedProviders;
            }
            if (candidateProviders.length === 1) {
                // there is only one debugger that qualifies, so use it
                debugProvider = candidateProviders[0];
            }
            else if (candidateProviders.length > 1) {
                // more than 1 debugger qualifies, so show picker showing candidates
                debugProvider = yield showProviderPick(candidateProviders);
            }
            else {
                throw "No valid debuggers were found for the processes currently running on the container.";
            }
        }
        return debugProvider;
    });
}
exports.getDebugProvider = getDebugProvider;
function getSupportedDebuggerTypes() {
    return supportedProviders.map((provider) => provider.getDebuggerType());
}
exports.getSupportedDebuggerTypes = getSupportedDebuggerTypes;
function getDebugProviderOfType(debuggerType) {
    return supportedProviders.find((debugProvider) => debugProvider.getDebuggerType() === debuggerType);
}
exports.getDebugProviderOfType = getDebugProviderOfType;
//# sourceMappingURL=providerRegistry.js.map