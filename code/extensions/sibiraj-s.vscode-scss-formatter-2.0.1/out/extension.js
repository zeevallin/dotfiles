"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const FormatterProvider_1 = require("./FormatterProvider");
const StatusBarService_1 = require("./StatusBarService");
const LoggingService_1 = require("./LoggingService");
const utils_1 = require("./utils");
const ACTIVATION_COMMAND = vscode_1.commands.registerCommand('scss-formatter.activate', () => {
    vscode_1.window.showInformationMessage('SCSS Formatter is Active');
});
// method is called when extension is activated
function activate(context) {
    const statusbarService = new StatusBarService_1.default();
    const loggingService = new LoggingService_1.default(statusbarService);
    const scssFormatter = new FormatterProvider_1.default(loggingService, statusbarService);
    context.subscriptions.push(vscode_1.languages.registerDocumentFormattingEditProvider(utils_1.languageSelector, scssFormatter));
    context.subscriptions.push(ACTIVATION_COMMAND);
    context.subscriptions.push(...loggingService.registerDisposables());
    context.subscriptions.push(...statusbarService.registerDisposables());
}
exports.activate = activate;
// method is called when extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map