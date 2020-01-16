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
const path = require("path");
const vscode_1 = require("vscode");
const database_1 = require("../common/database");
const infoNode_1 = require("./infoNode");
const schemaNode_1 = require("./schemaNode");
class DatabaseNode {
    constructor(connection) {
        this.connection = connection;
    }
    getTreeItem() {
        return {
            label: this.connection.database,
            collapsibleState: vscode_1.TreeItemCollapsibleState.Collapsed,
            contextValue: 'vscode-postgres.tree.database',
            command: {
                title: 'select-database',
                command: 'vscode-postgres.setActiveConnection',
                arguments: [this.connection]
            },
            iconPath: {
                light: path.join(__dirname, '../../resources/light/database.svg'),
                dark: path.join(__dirname, '../../resources/dark/database.svg')
            }
        };
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield database_1.Database.createConnection(this.connection);
            try {
                const res = yield connection.query(`
      SELECT nspname as name
      FROM pg_namespace
      WHERE
        nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
        AND nspname not like 'pg_temp_%'
        AND nspname not like 'pg_toast_temp_%'
        AND has_schema_privilege(oid, 'CREATE, USAGE')
      ORDER BY nspname;`);
                // return res.rows.map<TableNode>(table => {
                //   return new TableNode(this.connection, table.name, table.is_table, table.schema);
                // });
                return res.rows.map(schema => {
                    return new schemaNode_1.SchemaNode(this.connection, schema.name);
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
exports.DatabaseNode = DatabaseNode;
//# sourceMappingURL=databaseNode.js.map