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
const global_1 = require("../common/global");
const constants_1 = require("../common/constants");
'use strict';
class editConnectionCommand extends baseCommand_1.default {
    run(treeNode) {
        return __awaiter(this, void 0, void 0, function* () {
            // let selectedConnection: IConnection = null;
            let selectedConnId = null;
            let connections = global_1.Global.context.globalState.get(constants_1.Constants.GlobalStateKey);
            if (!connections) {
                vscode.window.showWarningMessage('There are no connections available to rename');
                return;
            }
            if (treeNode && treeNode.connection) {
                selectedConnId = treeNode.id;
            }
            else {
                let hosts = [];
                for (const k in connections) {
                    if (connections.hasOwnProperty(k))
                        hosts.push({ label: connections[k].label || connections[k].host, connection_key: k });
                }
                const hostToSelect = yield vscode.window.showQuickPick(hosts, { placeHolder: 'Select a connection', matchOnDetail: false });
                if (!hostToSelect)
                    return;
                selectedConnId = hostToSelect.connection_key;
            }
            const configDocument = yield vscode.workspace.openTextDocument(vscode.Uri.parse(`postgres-config:/${selectedConnId}.json`));
            yield vscode.window.showTextDocument(configDocument);
            // const label = await vscode.window.showInputBox({ prompt: "The display name of the database connection", placeHolder: "label", ignoreFocusOut: true });
            // selectedConnection.label = label;
            // connections[selectedConnId] = selectedConnection;
            // const tree = PostgreSQLTreeDataProvider.getInstance();
            // await tree.context.globalState.update(Constants.GlobalStateKey, connections);
            // tree.refresh();
        });
    }
}
exports.editConnectionCommand = editConnectionCommand;
//# sourceMappingURL=editConnection.js.map