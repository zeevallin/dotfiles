'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const client_1 = require("./language/client");
const treeProvider_1 = require("./tree/treeProvider");
const global_1 = require("./common/global");
const editorState_1 = require("./common/editorState");
const configFileSystem_1 = require("./common/configFileSystem");
const resultsManager_1 = require("./resultsview/resultsManager");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use the console to output diagnostic information (console.log) and errors (console.error)
        // This line of code will only be executed once when your extension is activated
        console.log('Congratulations, your extension "vscode-postgres" is now active!');
        let languageClient = new client_1.default(context);
        let treeProvider = treeProvider_1.PostgreSQLTreeDataProvider.getInstance(context);
        global_1.Global.context = context;
        editorState_1.EditorState.getInstance(languageClient);
        try {
            let commandPath = context.asAbsolutePath(path.join('out', 'commands'));
            let files = fs.readdirSync(commandPath);
            for (const file of files) {
                if (path.extname(file) === '.map')
                    continue;
                let baseName = path.basename(file, '.js');
                let className = baseName + 'Command';
                let commandClass = require(`./commands/${baseName}`);
                new commandClass[className](context);
            }
        }
        catch (err) {
            console.error('Command loading error:', err);
        }
        global_1.Global.ResultManager = new resultsManager_1.ResultsManager();
        context.subscriptions.push(global_1.Global.ResultManager);
        vscode.workspace.onDidOpenTextDocument((e) => __awaiter(this, void 0, void 0, function* () {
            yield editorState_1.EditorState.setNonActiveConnection(e, null);
        }));
        const configFS = new configFileSystem_1.ConfigFS();
        context.subscriptions.push(vscode.workspace.registerFileSystemProvider('postgres-config', configFS, { isCaseSensitive: true }));
        // EditorState.connection = null;
        // if (vscode.window && vscode.window.activeTextEditor) {
        //   let doc = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
        //   await EditorState.setNonActiveConnection(doc, null);
        //   EditorState.getInstance().onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
        // }
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map