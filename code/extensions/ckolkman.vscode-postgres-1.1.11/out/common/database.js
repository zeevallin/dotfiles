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
const fs = require("fs");
const vscode = require("vscode");
const path = require("path");
const pg_1 = require("pg");
const outputChannel_1 = require("./outputChannel");
;
;
;
class PgClient extends pg_1.Client {
    constructor(config) {
        super(config);
    }
}
exports.PgClient = PgClient;
class Database {
    // could probably be simplified, essentially matches Postgres' built-in algorithm without the char pointers
    static getQuotedIdent(name) {
        let result = '"';
        for (let i = 0; i < name.length; i++) {
            if (name.charAt(i) === '"')
                result += name.charAt(i);
            result += name.charAt(i);
        }
        return result + '"';
    }
    static getConnectionWithDB(connection, dbname) {
        if (!dbname)
            return connection;
        return {
            label: connection.label,
            host: connection.host,
            user: connection.user,
            password: connection.password,
            port: connection.port,
            database: dbname,
            multipleStatements: connection.multipleStatements,
            certPath: connection.certPath
        };
    }
    static createConnection(connection, dbname) {
        return __awaiter(this, void 0, void 0, function* () {
            const connectionOptions = Object.assign({}, connection);
            connectionOptions.database = dbname ? dbname : connection.database;
            if (connectionOptions.certPath && fs.existsSync(connectionOptions.certPath)) {
                connectionOptions.ssl = {
                    ca: fs.readFileSync(connectionOptions.certPath).toString()
                };
            }
            let client = new PgClient(connectionOptions);
            yield client.connect();
            const versionRes = yield client.query(`SELECT current_setting('server_version_num') as ver_num;`);
            /*
            return res.rows.map<ColumnNode>(column => {
              return new ColumnNode(this.connection, this.table, column);
            });
            */
            let versionNumber = parseInt(versionRes.rows[0].ver_num);
            client.pg_version = versionNumber;
            return client;
        });
    }
    static runQuery(sql, editor, connectionOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            let uri = editor.document.uri.toString();
            let title = path.basename(editor.document.fileName);
            let resultsUri = vscode.Uri.parse('postgres-results://' + uri);
            let connection = null;
            try {
                connection = yield Database.createConnection(connectionOptions);
                const typeNamesQuery = `select oid, format_type(oid, typtypmod) as display_type, typname from pg_type`;
                const types = yield connection.query(typeNamesQuery);
                const res = yield connection.query({ text: sql, rowMode: 'array' });
                const results = Array.isArray(res) ? res : [res];
                results.forEach((result) => {
                    result.fields.forEach((field) => {
                        let type = types.rows.find((t) => t.oid === field.dataTypeID);
                        if (type) {
                            field.format = type.typname;
                            field.display_type = type.display_type;
                        }
                    });
                });
                yield outputChannel_1.OutputChannel.displayResults(resultsUri, 'Results: ' + title, results);
                vscode.window.showTextDocument(editor.document, editor.viewColumn);
            }
            catch (err) {
                outputChannel_1.OutputChannel.appendLine(err);
                vscode.window.showErrorMessage(err.message);
                // vscode.window.showErrorMessage(err.message, "Show Console").then((button) => {
                //   if (button === 'Show Console') {
                //     OutputChannel.show();
                //   }
                // });
            }
            finally {
                if (connection)
                    yield connection.end();
            }
        });
    }
}
exports.Database = Database;
//# sourceMappingURL=database.js.map