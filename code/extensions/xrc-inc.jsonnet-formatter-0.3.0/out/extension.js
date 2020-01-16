'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const format_1 = require("./format");
function activate(ctx) {
    ctx.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'jsonnet' }, new format_1.JsonnetDocumentFormattingEditProvider()));
}
exports.activate = activate;
function deactivate() {
}
//# sourceMappingURL=extension.js.map