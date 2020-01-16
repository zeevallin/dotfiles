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
const treeProvider_1 = require("../tree/treeProvider");
const constants_1 = require("../common/constants");
const global_1 = require("../common/global");
'use strict';
class deleteConnectionCommand extends baseCommand_1.default {
    run(connectionNode) {
        return __awaiter(this, void 0, void 0, function* () {
            let connections = global_1.Global.context.globalState.get(constants_1.Constants.GlobalStateKey);
            if (!connections)
                connections = {};
            if (connectionNode) {
                yield deleteConnectionCommand.deleteConnection(connections, connectionNode.id);
                return;
            }
            let hosts = [];
            for (const k in connections) {
                if (connections.hasOwnProperty(k)) {
                    hosts.push({
                        label: connections[k].label || connections[k].host,
                        connection_key: k
                    });
                }
            }
            const hostToDelete = yield vscode.window.showQuickPick(hosts, { placeHolder: 'Select a connection to delete', matchOnDetail: false });
            if (!hostToDelete)
                return;
            yield deleteConnectionCommand.deleteConnection(connections, hostToDelete.connection_key);
        });
    }
    static deleteConnection(connections, key) {
        return __awaiter(this, void 0, void 0, function* () {
            delete connections[key];
            yield global_1.Global.context.globalState.update(constants_1.Constants.GlobalStateKey, connections);
            yield global_1.Global.keytar.deletePassword(constants_1.Constants.ExtensionId, key);
            treeProvider_1.PostgreSQLTreeDataProvider.getInstance().refresh();
            vscode.window.showInformationMessage('Connection Deleted');
        });
    }
}
exports.deleteConnectionCommand = deleteConnectionCommand;
//# sourceMappingURL=deleteConnection.js.map