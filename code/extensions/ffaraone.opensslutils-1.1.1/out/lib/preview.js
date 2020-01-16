"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const providers_1 = require("./providers");
const vscode = require("vscode");
let currentPreviewDocument = null;
const previewUri = vscode.Uri.parse('openssl-preview://authority/OpenSSL%20Preview');
let provider = new providers_1.OpenSSLTextDocumentContentProvider();
vscode.workspace.onDidChangeTextDocument((e) => {
    if (vscode.window.activeTextEditor && e.document === vscode.window.activeTextEditor.document) {
        provider.update(previewUri);
    }
});
vscode.window.onDidChangeActiveTextEditor((e) => {
    if (vscode.window.activeTextEditor && e && e.document === vscode.window.activeTextEditor.document) {
        if (e.document === currentPreviewDocument) {
            return;
        }
        provider.update(previewUri);
    }
});
vscode.workspace.onDidCloseTextDocument((e) => {
    if (e === currentPreviewDocument) {
        currentPreviewDocument = null;
    }
});
function previewDocument() {
    vscode.workspace.openTextDocument(previewUri).then(doc => {
        currentPreviewDocument = doc;
        vscode.window.showTextDocument(doc, {
            preserveFocus: true,
            preview: false,
            viewColumn: vscode.ViewColumn.Two
        });
    }, (reason) => {
        vscode.window.showErrorMessage(reason);
    });
}
const preview = {
    command: previewDocument,
    disposable: vscode.Disposable.from(vscode.workspace.registerTextDocumentContentProvider('openssl-preview', provider))
};
exports.default = preview;
//# sourceMappingURL=preview.js.map