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
const outputHandler_1 = require("./outputHandler");
const psqlformat_1 = require("psqlformat");
function fullDocumentRange(document) {
    const lastLineId = document.lineCount - 1;
    return new vscode.Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}
function getFormattedText(text, config, options) {
    try {
        let formattingOptions = Object.assign({}, config);
        // maxLength support has been removed and the following prevents
        // old settings from using it
        formattingOptions.maxLength = null;
        // Convert option strings to enums
        if (config.functionCase != null) {
            formattingOptions.functionCase =
                psqlformat_1.CaseOptionEnum[config.functionCase];
        }
        if (config.keywordCase != null) {
            formattingOptions.keywordCase =
                psqlformat_1.CaseOptionEnum[config.keywordCase];
        }
        if (!formattingOptions.spaces) {
            if (options.tabSize) {
                // If spaces config not specified, use the FormattingOptions value from VSCode workspace
                formattingOptions.spaces = Number(options.tabSize);
            }
            if (formattingOptions.tabs === undefined) {
                // Neither spaces nor tabs option is configured; use insertSpaces to determine if we want to use tabs
                formattingOptions.tabs = options.insertSpaces === false;
            }
        }
        outputHandler_1.addToOutput(`Formatting with options ${JSON.stringify(formattingOptions)}:`);
        let formatted = psqlformat_1.formatSql(text, formattingOptions);
        return formatted;
    }
    catch (err) {
        outputHandler_1.addToOutput(`ERROR: ${err}`);
    }
}
exports.getFormattedText = getFormattedText;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider([{ language: "sql" }, { language: "pgsql" }, { language: "postgres" }], {
        provideDocumentFormattingEdits
    }), outputHandler_1.setupOutputHandler());
}
exports.activate = activate;
function provideDocumentFormattingEdits(document, options, token) {
    return __awaiter(this, void 0, void 0, function* () {
        const edits = [];
        if (document.lineCount >= 1) {
            let firstLine = document.lineAt(0);
            if (firstLine.text.indexOf("pgFormatter-ignore") == -1) {
                // check for ignore text
                const text = document.getText();
                let config = vscode.workspace.getConfiguration("pgFormatter");
                let formattedText = getFormattedText(text, config, options);
                if (formattedText && formattedText.length > 0) {
                    // Do not replace if formatted is empty
                    edits.push(vscode.TextEdit.replace(fullDocumentRange(document), formattedText));
                }
            }
        }
        return edits;
    });
}
exports.provideDocumentFormattingEdits = provideDocumentFormattingEdits;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map