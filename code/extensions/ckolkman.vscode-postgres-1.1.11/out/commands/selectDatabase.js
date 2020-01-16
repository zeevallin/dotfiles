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
class selectDatabaseCommand extends baseCommand_1.default {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // vscode.window.showInformationMessage('Select Database!');
            let connectionDetails = editorState_1.EditorState.connection;
            if (!connectionDetails)
                return;
            const connection = yield database_1.Database.createConnection(connectionDetails, 'postgres');
            let databases = [];
            try {
                const res = yield connection.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
                databases = res.rows.map(database => database.datname);
            }
            finally {
                yield connection.end();
            }
            //vscode.window.showInputBox
            const db = yield vscode.window.showQuickPick(databases, { placeHolder: 'Select a database' });
            if (!db)
                return;
            editorState_1.EditorState.connection = database_1.Database.getConnectionWithDB(connectionDetails, db);
        });
    }
}
exports.selectDatabaseCommand = selectDatabaseCommand;
//# sourceMappingURL=selectDatabase.js.map