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
function isBashOnContainer(kubectl, podName, podNamespace, containerName) {
    return __awaiter(this, void 0, void 0, function* () {
        const nsarg = podNamespace ? `--namespace ${podNamespace}` : '';
        const containerCommand = containerName ? `-c ${containerName}` : '';
        const result = yield kubectl.invokeAsync(`exec ${podName} ${nsarg} ${containerCommand} -- ls -la /bin/bash`);
        return !result || !result.code;
    });
}
function suggestedShellForContainer(kubectl, podName, podNamespace, containerName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield isBashOnContainer(kubectl, podName, podNamespace, containerName)) {
            return 'bash';
        }
        return 'sh';
    });
}
exports.suggestedShellForContainer = suggestedShellForContainer;
//# sourceMappingURL=container-shell.js.map