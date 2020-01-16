"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const editorState_1 = require("../common/editorState");
class PostgreSQLLanguageClient {
    constructor(context) {
        let serverModule = context.asAbsolutePath(path.join('out', 'language', 'server.js'));
        let debugOptions = { execArgv: ['--nolazy', '--debug=6005', '--inspect'] };
        let serverOptions = {
            run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
            debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
        };
        let clientOptions = {
            documentSelector: [
                { language: 'postgres', scheme: 'file' },
                { language: 'postgres', scheme: 'untitled' }
            ]
        };
        this.client = new vscode_languageclient_1.LanguageClient('postgres', 'PostgreSQL Service', serverOptions, clientOptions);
        this.client.onReady().then(() => __awaiter(this, void 0, void 0, function* () {
            editorState_1.EditorState.connection = yield editorState_1.EditorState.getDefaultConnection();
        }));
        let disposable = this.client.start();
        context.subscriptions.push(disposable);
    }
    setConnection(connection) {
        if (!vscode.window.activeTextEditor)
            return;
        this.client.sendRequest('set_connection', { connection, documentUri: vscode.window.activeTextEditor.document.uri.toString() });
    }
}
exports.default = PostgreSQLLanguageClient;
//# sourceMappingURL=client.js.map