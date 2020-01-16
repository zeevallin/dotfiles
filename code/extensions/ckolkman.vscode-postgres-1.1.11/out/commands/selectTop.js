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
class selectTopCommand extends baseCommand_1.default {
    run(treeNode) {
        return __awaiter(this, void 0, void 0, function* () {
            // prompt for count
            const countInput = yield vscode.window.showInputBox({ prompt: "Select how many?", placeHolder: "limit" });
            if (!countInput)
                return;
            const count = parseInt(countInput);
            if (Number.isNaN(count)) {
                vscode.window.showErrorMessage('Invalid quantity for selection - should be a number');
                return;
            }
            const sql = `SELECT * FROM ${treeNode.getQuotedTableName()} LIMIT ${count};`;
            const textDocument = yield vscode.workspace.openTextDocument({ content: sql, language: 'postgres' });
            yield vscode.window.showTextDocument(textDocument);
            editorState_1.EditorState.connection = treeNode.connection;
            return database_1.Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection);
        });
    }
}
exports.selectTopCommand = selectTopCommand;
//# sourceMappingURL=selectTop.js.map