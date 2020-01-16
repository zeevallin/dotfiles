"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const converters_1 = require("./lib/converters");
const generators_1 = require("./lib/generators");
const preview_1 = require("./lib/preview");
const vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand('opensslutils.convertCrtToPem', converters_1.default.convertCrtToPem));
    context.subscriptions.push(vscode.commands.registerCommand('opensslutils.convertPemToCrt', converters_1.default.convertPemToCrt));
    context.subscriptions.push(preview_1.default.disposable);
    context.subscriptions.push(vscode.commands.registerCommand('opensslutils.showOpenSSLPreview', preview_1.default.command));
    context.subscriptions.push(vscode.commands.registerCommand('opensslutils.generatePrivKey', generators_1.default.generatePrivKey));
    context.subscriptions.push(vscode.commands.registerCommand('opensslutils.generateKeyCsr', generators_1.default.getKeyCsrGenerator(context.extensionPath)));
    context.subscriptions.push(vscode.commands.registerCommand('opensslutils.generateSelfSignedCert', generators_1.default.getSelfSignedCertGenerator(context.extensionPath)));
    context.subscriptions.push(vscode.commands.registerCommand('opensslutils.generatePkcs12', generators_1.default.getP12Generator(context.extensionPath)));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map