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
const observable_1 = require("../../utils/observable");
exports.NEXT_FN = "onNext();";
class Wizard {
    constructor(w) {
        this.w = w;
    }
    showPage(htmlBody) {
        return __awaiter(this, void 0, void 0, function* () {
            if (observable_1.isObservable(htmlBody)) {
                const webview = this.w.webview;
                htmlBody.subscribe({
                    onNext(value) {
                        return __awaiter(this, void 0, void 0, function* () {
                            return yield webview.postMessage({ command: 'showPage', html: value });
                        });
                    }
                });
            }
            else if (observable_1.isThenable(htmlBody)) {
                yield this.w.webview.postMessage({ command: 'showPage', html: yield htmlBody });
            }
            else {
                yield this.w.webview.postMessage({ command: 'showPage', html: htmlBody });
            }
            this.w.reveal();
        });
    }
}
exports.Wizard = Wizard;
function createWizard(tabTitle, formId, s) {
    const nextScript = `<script>
    const vscode = acquireVsCodeApi();
    const wvcontent = document.getElementById('wvcontent__');

    window.addEventListener('message', (e) => {
        const msg = e.data;
        switch (msg.command) {
            case 'showPage':
                wvcontent.innerHTML = msg.html;
                break;
        }
    });

    function onNext() {
        const s = { };
        for (const e of document.forms['${formId}'].elements) {
            s[e.name] = e.value;
        }
        vscode.postMessage(s);
    }
    </script>`;
    const html = `<html><body><div id='wvcontent__' />${nextScript}</body></html>`;
    const w = vscode.window.createWebviewPanel('vsk8s-dialog', tabTitle, vscode.ViewColumn.Active, {
        retainContextWhenHidden: true,
        enableScripts: true,
    });
    const wizard = new Wizard(w);
    w.webview.html = html;
    w.onDidDispose(() => s.onCancel());
    w.webview.onDidReceiveMessage((m) => {
        s.onStep(wizard, m);
    });
    w.reveal();
    return wizard;
}
exports.createWizard = createWizard;
//# sourceMappingURL=wizard.js.map