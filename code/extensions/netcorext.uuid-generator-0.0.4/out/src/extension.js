"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const uuid_1 = require("uuid");
const Constants = require("./constants");
const clipboard_1 = require("./clipboard");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "uuid-generator" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    for (const cmd of Constants.Commands) {
        context.subscriptions.push(vscode.commands.registerCommand(cmd, (args) => {
            const editor = vscode.window.activeTextEditor;
            generateUuid(cmd, editor);
        }));
    }
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
function generateUuid(cmd, editor) {
    if (editor === undefined || editor.selection === undefined) {
        copyUuid(uuid_1.v4());
        return;
    }
    let uuid = uuid_1.v4();
    editor.edit(editBuilder => {
        for (const selection of editor.selections) {
            editBuilder.replace(selection, uuid);
            if (cmd === Constants.UUID_GENERATE) {
                uuid = uuid_1.v4();
            }
        }
    });
}
function showMessage(uuid) {
    if (isNullOrWhiteSpace(uuid)) {
        return;
    }
    vscode.window.showInformationMessage(uuid);
}
function copyUuid(uuid) {
    clipboard_1.copy(uuid, () => {
        showMessage(uuid + ' is copied.');
    });
}
function isNullOrWhiteSpace(text) {
    return typeof text === 'string' && !text.trim() || typeof text === undefined || text === null;
}
//# sourceMappingURL=extension.js.map