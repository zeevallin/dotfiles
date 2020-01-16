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
const vscode = require("vscode");
const shell_1 = require("./shell");
const hostutils_1 = require("./hostutils");
const dictionary_1 = require("./utils/dictionary");
exports.host = {
    showErrorMessage: showErrorMessage,
    showWarningMessage: showWarningMessage,
    showInformationMessage: showInformationMessage,
    showQuickPick: showQuickPickAny,
    withProgress: withProgress,
    getConfiguration: getConfiguration,
    createTerminal: createTerminal,
    onDidCloseTerminal: onDidCloseTerminal,
    onDidChangeConfiguration: onDidChangeConfiguration,
    showInputBox: showInputBox,
    activeDocument: activeDocument,
    showDocument: showDocument,
    readDocument: readDocument,
    selectRootFolder: selectRootFolder,
    longRunning: longRunning
};
function showInputBox(options, token) {
    return vscode.window.showInputBox(options, token);
}
function showErrorMessage(message, ...items) {
    return vscode.window.showErrorMessage(message, ...items);
}
function showWarningMessage(message, ...items) {
    return vscode.window.showWarningMessage(message, ...items);
}
function showInformationMessage(message, ...items) {
    return vscode.window.showInformationMessage(message, ...items);
}
function showQuickPickStr(items, options) {
    return vscode.window.showQuickPick(items, options);
}
function showQuickPickT(items, options) {
    return vscode.window.showQuickPick(items, options);
}
function showQuickPickAny(items, options) {
    if (!Array.isArray(items)) {
        throw 'unexpected type passed to showQuickPick';
    }
    if (items.length === 0) {
        return showQuickPickStr(items, options);
    }
    const item = items[0];
    if (typeof item === 'string' || item instanceof String) {
        return showQuickPickStr(items, options);
    }
    else {
        return showQuickPickT(items, options);
    }
}
function withProgress(task) {
    return vscode.window.withProgress({ location: vscode.ProgressLocation.Window }, task);
}
function getConfiguration(key) {
    return vscode.workspace.getConfiguration(key);
}
function createTerminal(name, shellPath, shellArgs) {
    const terminalOptions = {
        name: name,
        shellPath: shellPath,
        shellArgs: shellArgs,
        env: shell_1.shellEnvironment(process.env)
    };
    return vscode.window.createTerminal(terminalOptions);
}
function onDidCloseTerminal(listener) {
    return vscode.window.onDidCloseTerminal(listener);
}
function onDidChangeConfiguration(listener) {
    return vscode.workspace.onDidChangeConfiguration(listener);
}
function activeDocument() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        return activeEditor.document;
    }
    return undefined;
}
function showDocument(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield vscode.workspace.openTextDocument(uri);
        if (document) {
            yield vscode.window.showTextDocument(document);
        }
        return document;
    });
}
function readDocument(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield vscode.workspace.openTextDocument(uri);
    });
}
function selectRootFolder() {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = yield hostutils_1.showWorkspaceFolderPick();
        if (!folder) {
            return undefined;
        }
        if (folder.uri.scheme !== 'file') {
            vscode.window.showErrorMessage("This command requires a filesystem folder"); // TODO: make it not
            return undefined;
        }
        return folder.uri.fsPath;
    });
}
const ACTIVE_LONG_RUNNING_OPERATIONS = dictionary_1.Dictionary.of();
function longRunning(uiOptions, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const uiOptionsObj = uiOptionsObjectOf(uiOptions);
        const options = {
            location: vscode.ProgressLocation.Notification,
            title: uiOptionsObj.title
        };
        return yield underLongRunningOperationKeyGuard(uiOptionsObj.operationKey, (alreadyShowingUI) => __awaiter(this, void 0, void 0, function* () {
            return alreadyShowingUI ?
                yield action() :
                yield vscode.window.withProgress(options, (_) => action());
        }));
    });
}
function underLongRunningOperationKeyGuard(operationKey, action) {
    return __awaiter(this, void 0, void 0, function* () {
        const alreadyShowingUI = !!operationKey && (ACTIVE_LONG_RUNNING_OPERATIONS[operationKey] || false);
        if (operationKey) {
            ACTIVE_LONG_RUNNING_OPERATIONS[operationKey] = true;
        }
        try {
            const result = yield action(alreadyShowingUI);
            return result;
        }
        finally {
            if (operationKey) {
                delete ACTIVE_LONG_RUNNING_OPERATIONS[operationKey];
            }
        }
    });
}
function uiOptionsObjectOf(uiOptions) {
    if (isLongRunningUIOptions(uiOptions)) {
        return uiOptions;
    }
    return { title: uiOptions };
}
function isLongRunningUIOptions(obj) {
    return !!(obj.title);
}
//# sourceMappingURL=host.js.map