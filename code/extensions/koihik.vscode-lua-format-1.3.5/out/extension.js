'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const cp = require("child_process");
const os = require("os");
const path = require("path");
const fs = require("fs");
const selectors = [
    { language: 'lua', scheme: 'file' },
    { language: 'lua', scheme: 'untitled' },
];
let diagnosticCollection;
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('lua-format');
    vscode.languages.registerDocumentFormattingEditProvider(selectors, new LuaFormatProvider(context));
}
exports.activate = activate;
// show info in problem panel
function updateDiagnostics(document, errorMsg) {
    if (errorMsg) {
        const errs = [];
        errorMsg.split('\n').forEach(err => {
            let pos = /^line (\d+):(\d+)/.exec(err);
            if (!pos || pos.length !== 3) {
                return;
            }
            // LuaFormatter: row start from 1, col start from 0
            pos = [parseInt(pos[1]) - 1, parseInt(pos[2])];
            const range = new vscode.Range(new vscode.Position(pos[0], pos[1]), new vscode.Position(pos[0], pos[1]));
            errs.push({
                message: err,
                range,
                severity: vscode.DiagnosticSeverity.Error,
            });
        });
        diagnosticCollection.set(document.uri, errs);
    }
    else {
        diagnosticCollection.clear();
    }
}
class LuaFormatProvider {
    constructor(context) {
        this.context = context;
    }
    resolvePath(fileName) {
        if (path.isAbsolute(fileName)) {
            if (fs.existsSync(fileName)) {
                return fileName;
            }
        }
        else {
            for (const workspaceFolder of vscode.workspace.workspaceFolders || []) {
                const fullPath = path.resolve(workspaceFolder.uri.path, fileName);
                if (fs.existsSync(fullPath)) {
                    return fullPath;
                }
            }
        }
        throw new Error(`Cannot find file: '${fileName}'`);
    }
    provideDocumentFormattingEdits(document, options, token) {
        const data = document.getText();
        return new Promise((resolve, reject) => {
            let configPath = vscode.workspace.getConfiguration().get("vscode-lua-format.configPath");
            let binaryPath = vscode.workspace.getConfiguration().get("vscode-lua-format.binaryPath");
            const args = [];
            if (configPath) {
                try {
                    configPath = this.resolvePath(configPath);
                    args.push("-c");
                    args.push(configPath);
                }
                catch (error) {
                    vscode.window.showWarningMessage(`Cannot find config file '${configPath}', fallback to default config.`);
                }
            }
            if (!binaryPath) {
                const platform = os.platform();
                binaryPath = `${this.context.extensionPath}/bin/`;
                if (platform === "linux" || platform === "darwin" || platform === "win32") {
                    binaryPath += platform;
                }
                else {
                    reject(`vscode-lua-format do not support '${platform}'.`);
                    return;
                }
                binaryPath += "/lua-format";
            }
            else {
                binaryPath = this.resolvePath(binaryPath);
            }
            const cmd = cp.spawn(binaryPath, args, {});
            const result = [], errorMsg = [];
            cmd.on('error', err => {
                vscode.window.showErrorMessage(`Run lua-format error: '${err.message}'`);
                reject(err);
            });
            cmd.stdout.on('data', data => {
                result.push(Buffer.from(data));
            });
            cmd.stderr.on('data', data => {
                errorMsg.push(Buffer.from(data));
            });
            cmd.on('exit', code => {
                const resultStr = Buffer.concat(result).toString();
                const errorMsgStr = Buffer.concat(errorMsg).toString();
                updateDiagnostics(document, errorMsgStr);
                if (code) {
                    reject();
                    return;
                }
                if (resultStr.length > 0) {
                    const range = document.validateRange(new vscode.Range(0, 0, Infinity, Infinity));
                    resolve([new vscode.TextEdit(range, resultStr)]);
                }
                else {
                    reject(`unexpected error: ${errorMsgStr}`);
                }
            });
            cmd.stdin.write(data);
            cmd.stdin.end();
        });
    }
}
//# sourceMappingURL=extension.js.map