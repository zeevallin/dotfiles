"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const global_1 = require("./global");
class OutputChannel {
    static show() {
        OutputChannel.outputChannel.show(true);
    }
    static appendLine(value, show) {
        if (show)
            OutputChannel.outputChannel.show(true);
        OutputChannel.outputChannel.appendLine(value);
    }
    static displayResults(uri, title, res) {
        let viewColumn = OutputChannel.getViewColumn();
        global_1.Global.ResultManager.showResults(uri, viewColumn, res);
    }
    static getViewColumn() {
        const resourceColumn = (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) || vscode.ViewColumn.One;
        return resourceColumn + 1;
    }
}
OutputChannel.outputChannel = vscode.window.createOutputChannel('PostgreSQL');
exports.OutputChannel = OutputChannel;
//# sourceMappingURL=outputChannel.js.map