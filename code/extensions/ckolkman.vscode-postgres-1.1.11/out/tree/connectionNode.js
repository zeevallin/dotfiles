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
const vscode = require("vscode");
const path = require("path");
const database_1 = require("../common/database");
const databaseNode_1 = require("./databaseNode");
const infoNode_1 = require("./infoNode");
class ConnectionNode {
    constructor(id, connection) {
        this.id = id;
        this.connection = connection;
    }
    getTreeItem() {
        return {
            label: this.connection.label || this.connection.host,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            contextValue: "vscode-postgres.tree.connection",
            command: {
                title: 'select-database',
                command: 'vscode-postgres.setActiveConnection',
                arguments: [this.connection]
            },
            iconPath: {
                light: path.join(__dirname, '../../resources/light/server.svg'),
                dark: path.join(__dirname, '../../resources/dark/server.svg')
            }
        };
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection.database) {
                return [new databaseNode_1.DatabaseNode(this.connection)];
            }
            const connection = yield database_1.Database.createConnection(this.connection, 'postgres');
            try {
                // Get all database where permission was granted
                const res = yield connection.query(`
      SELECT datname
      FROM pg_database
      WHERE
        datistemplate = false
        AND has_database_privilege(datname, 'TEMP, CONNECT') = true
      ORDER BY datname;`);
                return res.rows.map(database => {
                    return new databaseNode_1.DatabaseNode(database_1.Database.getConnectionWithDB(this.connection, database.datname));
                });
            }
            catch (err) {
                return [new infoNode_1.InfoNode(err)];
            }
            finally {
                yield connection.end();
            }
        });
    }
}
exports.ConnectionNode = ConnectionNode;
//# sourceMappingURL=connectionNode.js.map