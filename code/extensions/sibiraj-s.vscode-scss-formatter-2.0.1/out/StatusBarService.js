"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const utils_1 = require("./utils");
function checkForInConsoleTabSwitch(editor) {
    // output and debug console is also seen as an editor
    // hence switching tabs will trigger the function
    // this prevents hiding statusBarItem when switching between tabs
    return ['debug', 'output'].some((part) => editor.document.uri.scheme === part);
}
class StatusBarService {
    constructor() {
        this.statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, -1);
        this.statusBarItem.text = utils_1.EXTENSION_NAME;
        this.statusBarItem.tooltip = `${utils_1.EXTENSION_NAME}: v${utils_1.EXTENSION_VERSION}`;
        this.statusBarItem.command = 'scss-formatter.open-output';
        this.toggleStatusBarItem(vscode_1.window.activeTextEditor);
    }
    registerDisposables() {
        return [
            // Keep track whether to show/hide the statusbar
            vscode_1.window.onDidChangeActiveTextEditor((editor) => {
                this.toggleStatusBarItem(editor);
            })
        ];
    }
    // toggle statusBarItem when document changes
    toggleStatusBarItem(editor) {
        if (!this.statusBarItem) {
            return;
        }
        if (editor !== undefined) {
            if (checkForInConsoleTabSwitch(editor)) {
                return;
            }
            // hide statusBarItem if document changes and doesn't match supported languages
            const score = vscode_1.languages.match(utils_1.supportedLanguages, editor.document);
            score ? this.statusBarItem.show() : this.statusBarItem.hide();
        }
        else {
            this.statusBarItem.hide();
        }
    }
    // update statusBarItem text and tooltip
    updateStatusBarItem(message) {
        this.statusBarItem.text = message;
        this.statusBarItem.show();
    }
    reset() {
        this.statusBarItem.text = utils_1.EXTENSION_NAME;
    }
}
exports.default = StatusBarService;
//# sourceMappingURL=StatusBarService.js.map