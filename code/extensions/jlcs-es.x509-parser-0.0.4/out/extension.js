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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const vscode_1 = require("vscode");
const openssl = require("openssl-commander");
const tmp_promise_1 = require("tmp-promise");
const fs = require('fs').promises;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    /////////////////////////////////
    ////// x509 Parser //////////////
    /////////////////////////////////
    context.subscriptions.push(vscode.commands.registerCommand('extension.parseX509', () => __awaiter(this, void 0, void 0, function* () {
        yield runAndShowOpenSSLCmd("x509 -text");
    })));
    /////////////////////////////////
    /////////////////////////////////
    /////////////////////////////////
    //////// CSR Parser /////////////
    /////////////////////////////////
    context.subscriptions.push(vscode.commands.registerCommand('extension.parseCSR', () => __awaiter(this, void 0, void 0, function* () {
        yield runAndShowOpenSSLCmd("req -text");
    })));
    /////////////////////////////////
    /////////////////////////////////
    /////////////////////////////////
    /////// EC Key Parser ///////////
    /////////////////////////////////
    context.subscriptions.push(vscode.commands.registerCommand('extension.parseECkey', () => __awaiter(this, void 0, void 0, function* () {
        let password = yield vscode.window.showInputBox({
            prompt: "Password for EC Private Key [ leave empty if none ]",
            password: true
        });
        if (!password)
            yield runAndShowOpenSSLCmd("ec -text");
        else
            yield runAndShowOpenSSLCmd(`ec -text -passin pass:${password}`);
    })));
    /////////////////////////////////
    /////////////////////////////////
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
function runAndShowOpenSSLCmd(command) {
    return __awaiter(this, void 0, void 0, function* () {
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let result = openssl.stdin(editor.document.getText()).cmd(command).exec();
        let output = result.stdout;
        if (result.status !== 0) {
            output = result.stderr;
        }
        try {
            let tmpfile = yield tmp_promise_1.file({
                keep: true,
                prefix: `${command.split(" ")[0]}-`,
                postfix: ".openssl"
            });
            yield fs.writeFile(tmpfile.path, output);
            let doc = yield vscode.workspace.openTextDocument(tmpfile.path);
            yield vscode.window.showTextDocument(doc, { preview: false, viewColumn: vscode_1.ViewColumn.Beside });
        }
        catch (e) {
            vscode.window.showErrorMessage(e);
            return;
        }
    });
}
//# sourceMappingURL=extension.js.map