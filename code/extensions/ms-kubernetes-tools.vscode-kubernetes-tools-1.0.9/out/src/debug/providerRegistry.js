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
const javaDebugProvider_1 = require("./javaDebugProvider");
const nodejsDebugProvider_1 = require("./nodejsDebugProvider");
const pythonDebugProvider_1 = require("./pythonDebugProvider");
const supportedProviders = [
    new javaDebugProvider_1.JavaDebugProvider(),
    new nodejsDebugProvider_1.NodejsDebugProvider(),
    new pythonDebugProvider_1.PythonDebugProvider()
];
function showProviderPick() {
    return __awaiter(this, void 0, void 0, function* () {
        const providerItems = supportedProviders.map((provider) => {
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
function getDebugProvider(baseImage) {
    return __awaiter(this, void 0, void 0, function* () {
        let debugProvider = null;
        if (baseImage) {
            debugProvider = supportedProviders.find((provider) => provider.isSupportedImage(baseImage));
        }
        if (!debugProvider) {
            debugProvider = yield showProviderPick();
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