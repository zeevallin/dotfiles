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
const dictionary_1 = require("../../utils/dictionary");
class PortForwardStatusBarManager {
    constructor(statusBarItem) {
        this.statusBarItem = statusBarItem;
        this.sessions = dictionary_1.Dictionary.of();
    }
    static init(statusBarItem) {
        const manager = new PortForwardStatusBarManager(statusBarItem);
        manager.refreshPortForwardStatus();
        return manager;
    }
    registerPortForward(session) {
        const lookupKey = keyOf(session);
        this.sessions[lookupKey] = session;
        this.refreshPortForwardStatus();
        return lookupKey;
    }
    unregisterPortForward(cookie) {
        const session = this.sessions[cookie];
        if (session.onCancel) {
            session.onCancel();
        }
        delete this.sessions[cookie];
        this.refreshPortForwardStatus();
    }
    showSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = this.listSessions().map((s) => ({
                label: `local:${s.localPort} -> ${podDisplayName(s)}:${s.remotePort}`,
                description: s.description,
                session: s
            }));
            const chosen = yield vscode.window.showQuickPick(items, { placeHolder: "Choose a port forwarding session to terminate it" });
            if (chosen) {
                const confirmed = yield this.confirmCancel(chosen.session);
                if (confirmed) {
                    chosen.session.terminator.dispose();
                }
            }
        });
    }
    confirmCancel(session) {
        return __awaiter(this, void 0, void 0, function* () {
            const stopForwarding = 'Stop Forwarding';
            const description = session.description ? ` (${session.description})` : '';
            const warning = `This will stop forwarding local port ${session.localPort} to ${podDisplayName(session)}${description}`;
            const choice = yield vscode.window.showWarningMessage(warning, stopForwarding);
            return (choice === stopForwarding);
        });
    }
    refreshPortForwardStatus() {
        const sessionCount = Object.keys(this.sessions).length;
        if (sessionCount > 0) {
            this.statusBarItem.text = 'Kubectl Port Forwarding';
            this.statusBarItem.tooltip = `kubectl is currently running ${sessionCount} port forwarding session(s) in the background.  Click to view and terminate.`;
            this.statusBarItem.command = 'kubernetes.portForwarding.showSessions';
            this.statusBarItem.show();
        }
        else {
            this.statusBarItem.hide();
        }
    }
    listSessions() {
        return Object.keys(this.sessions).map((k) => this.sessions[k]);
    }
}
exports.PortForwardStatusBarManager = PortForwardStatusBarManager;
function keyOf(session) {
    return `PFSESSIONKEY/${session.podName}/${session.podNamespace || ''}/${session.localPort}`;
}
function podDisplayName(session) {
    if (session.podNamespace) {
        return `${session.podNamespace}/${session.podName}`;
    }
    return session.podName;
}
//# sourceMappingURL=port-forward-ui.js.map