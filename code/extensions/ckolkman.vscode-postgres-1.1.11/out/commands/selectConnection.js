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
const global_1 = require("../common/global");
const constants_1 = require("../common/constants");
'use strict';
class selectConnectionCommand extends baseCommand_1.default {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // can we even select a connection it gets stored against a document uri
            if (!vscode.window || !vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document || !vscode.window.activeTextEditor.document.uri) {
                // alert and return;
                vscode.window.showWarningMessage('Unable to select a connection - a document is not active');
                return;
            }
            let connections = global_1.Global.context.globalState.get(constants_1.Constants.GlobalStateKey);
            if (!connections)
                connections = {};
            let hosts = [];
            hosts.push({
                label: '$(plus) Create new connection',
                connection_key: '',
                is_new_selector: true
            });
            for (const k in connections) {
                if (connections.hasOwnProperty(k)) {
                    hosts.push({
                        label: connections[k].label || connections[k].host,
                        connection_key: k
                    });
                }
            }
            const hostToSelect = yield vscode.window.showQuickPick(hosts, { placeHolder: 'Select a connection', matchOnDetail: false });
            if (!hostToSelect)
                return;
            if (!hostToSelect.is_new_selector) {
                let connection = Object.assign({}, connections[hostToSelect.connection_key]);
                if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
                    connection.password = yield global_1.Global.keytar.getPassword(constants_1.Constants.ExtensionId, hostToSelect.connection_key);
                }
                editorState_1.EditorState.connection = connection;
                yield vscode.commands.executeCommand('vscode-postgres.selectDatabase');
                return;
            }
            let result = yield vscode.commands.executeCommand('vscode-postgres.addConnection');
            if (!result)
                return;
            yield vscode.commands.executeCommand('vscode-postgres.selectDatabase');
        });
    }
}
exports.selectConnectionCommand = selectConnectionCommand;
//# sourceMappingURL=selectConnection.js.map