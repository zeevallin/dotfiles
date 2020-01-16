"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openssl_1 = require("./openssl");
const vscode = require("vscode");
class OpenSSLTextDocumentContentProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
    }
    provideTextDocumentContent(uri) {
        return this.processDocument();
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    processDocument() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return 'no editor';
        }
        const text = editor.document.getText().trim();
        if (text.startsWith('-----BEGIN CERTIFICATE-----')) {
            return openssl_1.default.parsePem(text);
        }
        else if (text.startsWith('-----BEGIN CERTIFICATE REQUEST-----') || text.startsWith('-----BEGIN NEW CERTIFICATE REQUEST-----')) {
            return openssl_1.default.parseCsr(text);
        }
        return 'Preview not available';
    }
}
exports.OpenSSLTextDocumentContentProvider = OpenSSLTextDocumentContentProvider;
//# sourceMappingURL=providers.js.map