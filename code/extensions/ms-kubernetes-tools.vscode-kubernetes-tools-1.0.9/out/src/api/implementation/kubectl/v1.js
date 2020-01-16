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
function impl(kubectl, portForwardStatusBarManager) {
    return new KubectlV1Impl(kubectl, portForwardStatusBarManager);
}
exports.impl = impl;
class KubectlV1Impl {
    constructor(kubectl, portForwardStatusBarManager) {
        this.kubectl = kubectl;
        this.portForwardStatusBarManager = portForwardStatusBarManager;
    }
    invokeCommand(command) {
        return this.kubectl.invokeAsync(command);
    }
    // TODO: move into core kubectl module
    // And/or convert to invokeBackground API and make portForward a wrapper over that
    portForward(podName, podNamespace, localPort, remotePort, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const nsarg = podNamespace ? ['--namespace', podNamespace] : [];
            const cmd = ['port-forward', podName, `${localPort}:${remotePort}`, ...nsarg];
            const pfProcess = yield this.kubectl.spawnAsChild(cmd);
            if (!pfProcess) {
                return undefined;
            }
            const forwarding = yield waitForOutput(pfProcess, /Forwarding\s+from\s+127\.0\.0\.1:/);
            if (forwarding === WaitForOutputResult.Success) {
                const onTerminate = [() => pfProcess.kill()];
                const terminator = { dispose: () => { for (const action of onTerminate) {
                        action();
                    } } };
                if (options && options.showInUI && options.showInUI.location === 'status-bar') {
                    const session = {
                        podName,
                        podNamespace,
                        localPort,
                        remotePort,
                        terminator: terminator,
                        description: options.showInUI.description,
                        onCancel: options.showInUI.onCancel
                    };
                    const cookie = this.portForwardStatusBarManager.registerPortForward(session);
                    const removeFromUI = () => this.portForwardStatusBarManager.unregisterPortForward(cookie);
                    onTerminate.push(removeFromUI);
                }
                return vscode.Disposable.from(terminator);
            }
            return undefined;
        });
    }
}
var WaitForOutputResult;
(function (WaitForOutputResult) {
    WaitForOutputResult[WaitForOutputResult["Success"] = 1] = "Success";
    WaitForOutputResult[WaitForOutputResult["ProcessExited"] = 2] = "ProcessExited";
})(WaitForOutputResult || (WaitForOutputResult = {}));
function waitForOutput(process, pattern) {
    return new Promise((resolve) => {
        let didOutput = false;
        process.stdout.on('data', (data) => __awaiter(this, void 0, void 0, function* () {
            const message = `${data}`;
            if (pattern.test(message)) {
                didOutput = true;
                resolve(WaitForOutputResult.Success);
            }
        }));
        process.on('close', (_code) => __awaiter(this, void 0, void 0, function* () {
            if (!didOutput) {
                resolve(WaitForOutputResult.ProcessExited);
            }
        }));
    });
}
//# sourceMappingURL=v1.js.map