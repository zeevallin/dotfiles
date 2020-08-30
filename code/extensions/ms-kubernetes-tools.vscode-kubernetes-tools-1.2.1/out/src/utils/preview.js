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
function preview(uri, column, tabTitle) {
    return __awaiter(this, void 0, void 0, function* () {
        const html = yield getHTML(uri);
        const w = vscode.window.createWebviewPanel('vsk8s-preview', tabTitle, column, {
            retainContextWhenHidden: false,
            enableScripts: false,
        });
        w.webview.html = html;
        w.reveal();
    });
}
exports.preview = preview;
function getHTML(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const doc = yield vscode.workspace.openTextDocument(uri);
        return doc.getText();
    });
}
//# sourceMappingURL=preview.js.map