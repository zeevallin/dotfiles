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
const functionNode_1 = require("./functionNode");
const infoNode_1 = require("./infoNode");
const queries_1 = require("../queries");
class FunctionFolderNode {
    constructor(connection, schemaName) {
        this.connection = connection;
        this.schemaName = schemaName;
    }
    getTreeItem() {
        return {
            label: "Functions",
            collapsibleState: vscode_1.TreeItemCollapsibleState.Collapsed,
            contextValue: 'vscode-postgres.tree.function-folder',
            iconPath: {
                light: path.join(__dirname, `../../resources/light/func-folder.svg`),
                dark: path.join(__dirname, `../../resources/dark/func-folder.svg`)
            }
        };
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield database_1.Database.createConnection(this.connection);
            try {
                // const res = await connection.query(`
                // SELECT n.nspname as "schema",
                //   p.proname as "name",
                //   d.description,
                //   pg_catalog.pg_get_function_result(p.oid) as "result_type",
                //   pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
                // CASE
                //   WHEN p.proisagg THEN 'agg'
                //   WHEN p.proiswindow THEN 'window'
                //   WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
                //   ELSE 'normal'
                // END as "type"
                // FROM pg_catalog.pg_proc p
                //     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
                //     LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
                // WHERE n.nspname = $1
                //   AND p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
                //   AND has_schema_privilege(quote_ident(n.nspname), 'USAGE') = true
                //   AND has_function_privilege(p.oid, 'execute') = true
                // ORDER BY 1, 2, 4;`, [this.schemaName]);
                let query = queries_1.SqlQueryManager.getVersionQueries(connection.pg_version);
                const res = yield connection.query(query.GetFunctions, [this.schemaName]);
                return res.rows.map(func => {
                    var args = func.argument_types != null ? func.argument_types.split(',').map(arg => {
                        return String(arg).trim();
                    }) : [];
                    return new functionNode_1.FunctionNode(this.connection, func.name, args, func.result_type, func.schema, func.description);
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
exports.FunctionFolderNode = FunctionFolderNode;
//# sourceMappingURL=funcFolderNode.js.map