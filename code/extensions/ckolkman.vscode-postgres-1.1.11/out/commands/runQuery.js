"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const baseCommand_1 = require("../common/baseCommand");
const vscode = require("vscode");
const editorState_1 = require("../common/editorState");
const database_1 = require("../common/database");
'use strict';
class runQueryCommand extends baseCommand_1.default {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!vscode.window.activeTextEditor && !vscode.window.activeTextEditor.document) {
                vscode.window.showWarningMessage('No SQL file selected');
                return;
            }
            let connection = editorState_1.EditorState.connection;
            if (!connection) {
                vscode.window.showWarningMessage('No PostgreSQL Server or Database selected');
                return;
            }
            let editor = vscode.window.activeTextEditor;
            let querySelection = null;
            // Calculate the selection if we have a selection, otherwise we'll use null to indicate
            // the entire document is the selection
            if (!editor.selection.isEmpty) {
                let selection = editor.selection;
                querySelection = {
                    startLine: selection.start.line,
                    startColumn: selection.start.character,
                    endLine: selection.end.line,
                    endColumn: selection.end.character
                };
            }
            else {
                querySelection = {
                    startLine: 0,
                    startColumn: 0,
                    endLine: editor.document.lineCount
                    //endColumn: editor.document.lineAt(editor.document.lineCount).range.end.
                };
            }
            // Trim down the selection. If it is empty after selecting, then we don't execute
            let selectionToTrim = editor.selection.isEmpty ? undefined : editor.selection;
            if (editor.document.getText(selectionToTrim).trim().length === 0) {
                vscode.window.showWarningMessage('No SQL found to run');
                return;
            }
            let sql = editor.document.getText(selectionToTrim);
            return database_1.Database.runQuery(sql, editor, connection);
        });
    }
}
exports.runQueryCommand = runQueryCommand;
//# sourceMappingURL=runQuery.js.map