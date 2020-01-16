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
const columnNode_1 = require("./columnNode");
const global_1 = require("../common/global");
const queries_1 = require("../queries");
class TableNode {
    constructor(connection, table, is_table, schema) {
        this.connection = connection;
        this.table = table;
        this.is_table = is_table;
        this.schema = schema;
    }
    getQuotedTableName() {
        let quotedSchema = this.schema && this.schema !== 'public' ? database_1.Database.getQuotedIdent(this.schema) : null;
        let quotedTable = database_1.Database.getQuotedIdent(this.table);
        return quotedSchema ? `${quotedSchema}.${quotedTable}` : quotedTable;
    }
    getTreeItem() {
        return {
            label: this.table,
            collapsibleState: vscode_1.TreeItemCollapsibleState.Collapsed,
            contextValue: 'vscode-postgres.tree.table',
            iconPath: {
                light: path.join(__dirname, `../../resources/light/${this.is_table ? 'table' : 'view'}.svg`),
                dark: path.join(__dirname, `../../resources/dark/${this.is_table ? 'table' : 'view'}.svg`)
            }
        };
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield database_1.Database.createConnection(this.connection);
            //config.get<boolean>("prettyPrintJSONfields") ? `.jsonb-field, .json-field { white-space: pre; }` : ``;
            const configSort = global_1.Global.Configuration.get("tableColumnSortOrder");
            const sortOptions = {
                "db-order": 'a.attnum',
                "alpha": 'a.attname',
                "reverse-alpha": 'a.attname DESC'
            };
            if (!sortOptions[configSort])
                sortOptions[configSort] = 'a.attnum';
            let tableSchema = this.schema ? this.schema : 'public';
            let query = queries_1.SqlQueryManager.getVersionQueries(connection.pg_version);
            try {
                let res = null;
                // sorting is done via format - other fields through parameterized queries
                res = yield connection.query(query.format(query.TableColumns, sortOptions[configSort]), [
                    this.getQuotedTableName(),
                    this.connection.database,
                    tableSchema,
                    this.table
                ]);
                return res.rows.map(column => {
                    return new columnNode_1.ColumnNode(this.connection, this.table, column);
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
exports.TableNode = TableNode;
//# sourceMappingURL=tableNode.js.map