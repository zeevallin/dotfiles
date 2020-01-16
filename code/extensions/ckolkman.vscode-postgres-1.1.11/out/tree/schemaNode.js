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
const tableNode_1 = require("./tableNode");
const infoNode_1 = require("./infoNode");
const global_1 = require("../common/global");
const funcFolderNode_1 = require("./funcFolderNode");
class SchemaNode {
    constructor(connection, schemaName) {
        this.connection = connection;
        this.schemaName = schemaName;
    }
    getTreeItem() {
        return {
            label: this.schemaName,
            collapsibleState: vscode_1.TreeItemCollapsibleState.Collapsed,
            contextValue: 'vscode-postgres.tree.schema',
            command: {
                title: 'select-database',
                command: 'vscode-postgres.setActiveConnection',
                arguments: [this.connection]
            },
            iconPath: {
                light: path.join(__dirname, '../../resources/light/schema.svg'),
                dark: path.join(__dirname, '../../resources/dark/schema.svg')
            }
        };
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield database_1.Database.createConnection(this.connection);
            const configVirtFolders = global_1.Global.Configuration.get("virtualFolders");
            try {
                const res = yield connection.query(`
      SELECT
          tablename as name,
          true as is_table,
          schemaname AS schema
        FROM pg_tables
        WHERE 
          schemaname = $1
          AND has_table_privilege(quote_ident(schemaname) || '.' || quote_ident(tablename), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
      UNION ALL
      SELECT
          viewname as name,
          false as is_table,
          schemaname AS schema
        FROM pg_views
        WHERE 
          schemaname = $1
          AND has_table_privilege(quote_ident(schemaname) || '.' || quote_ident(viewname), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
      ORDER BY name;`, [this.schemaName]);
                let childs = [];
                if (configVirtFolders != null) {
                    if (configVirtFolders.indexOf("functions") !== -1) {
                        childs.push(new funcFolderNode_1.FunctionFolderNode(this.connection, this.schemaName));
                    }
                }
                // Append tables under virtual folders
                return childs.concat(res.rows.map(table => {
                    return new tableNode_1.TableNode(this.connection, table.name, table.is_table, table.schema);
                }));
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
exports.SchemaNode = SchemaNode;
//# sourceMappingURL=schemaNode.js.map