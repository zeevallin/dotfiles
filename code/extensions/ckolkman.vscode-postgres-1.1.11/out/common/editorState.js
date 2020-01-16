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
const global_1 = require("./global");
const constants_1 = require("./constants");
const database_1 = require("./database");
class EditorState {
    constructor(languageClient) {
        this.languageClient = languageClient;
        this.metadata = new Map();
        vscode.window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this);
        vscode.workspace.onDidCloseTextDocument(this.onDidCloseTextDocument, this);
        vscode.workspace.onDidOpenTextDocument(this.onDidOpenTextDocument, this);
    }
    static getInstance(languageClient) {
        if (!EditorState._instance && languageClient)
            EditorState._instance = new EditorState(languageClient);
        return EditorState._instance;
    }
    static get connection() {
        let window = vscode.window;
        let te = window ? window.activeTextEditor : null;
        let doc = te ? te.document : null;
        let uri = doc ? doc.uri : null;
        if (!uri)
            return null;
        return EditorState.getInstance().metadata.get(uri.toString());
    }
    static set connection(newConn) {
        let window = vscode.window;
        let te = window ? window.activeTextEditor : null;
        let doc = te ? te.document : null;
        let uri = doc ? doc.uri : null;
        if (!uri)
            return;
        EditorState.getInstance().metadata.set(uri.toString(), newConn);
        EditorState.getInstance().onDidChangeActiveTextEditor(te);
    }
    static setNonActiveConnection(doc, newConn) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!doc && !doc.uri)
                return;
            if (!newConn) {
                newConn = yield EditorState.getDefaultConnection();
            }
            EditorState.getInstance().metadata.set(doc.uri.toString(), newConn);
            if (vscode.window && vscode.window.activeTextEditor) {
                EditorState.getInstance().onDidChangeActiveTextEditor(vscode.window.activeTextEditor);
            }
        });
    }
    static getDefaultConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            let defaultConnection = global_1.Global.Configuration.get("defaultConnection");
            if (!defaultConnection)
                return null;
            let connections = global_1.Global.context.globalState.get(constants_1.Constants.GlobalStateKey);
            if (!connections)
                connections = {};
            let connection = null;
            for (const k in connections) {
                if (connections.hasOwnProperty(k)) {
                    let connFound = (k === defaultConnection);
                    if (!connFound) {
                        let connName = connections[k].label || connections[k].host;
                        connFound = (connName === defaultConnection);
                    }
                    if (connFound) {
                        connection = Object.assign({}, connections[k]);
                        if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
                            connection.password = yield global_1.Global.keytar.getPassword(constants_1.Constants.ExtensionId, k);
                        }
                        break;
                    }
                }
            }
            let defaultDatabase = global_1.Global.Configuration.get("defaultDatabase");
            if (defaultDatabase) {
                const conn = yield database_1.Database.createConnection(connection, 'postgres');
                let databases = [];
                try {
                    const res = yield conn.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
                    databases = res.rows.map(database => database.datname);
                }
                finally {
                    yield conn.end();
                }
                if (databases.indexOf(defaultDatabase)) {
                    connection = database_1.Database.getConnectionWithDB(connection, defaultDatabase);
                }
            }
            return connection;
        });
    }
    onDidChangeActiveTextEditor(e) {
        let conn = e && e.document && e.document.uri ? this.metadata.get(e.document.uri.toString()) : null;
        this.languageClient.setConnection(conn);
        if (conn) {
            // set the status buttons
            this.setStatusButtons(conn);
        }
        else {
            // clear the status buttons
            this.removeStatusButtons();
        }
    }
    setStatusButtons(conn) {
        if (!this.statusBarServer) {
            this.statusBarServer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this.statusBarServer.tooltip = 'Change Active Server';
        }
        this.statusBarServer.text = `$(server) ${conn.label || conn.host}`;
        this.statusBarServer.command = 'vscode-postgres.selectConnection';
        this.statusBarServer.show();
        // if (!conn.database) {
        //   if (this.statusBarDatabase) {
        //   }
        //     // this.statusBarDatabase.hide();
        //   return;
        // }
        if (!this.statusBarDatabase) {
            this.statusBarDatabase = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this.statusBarDatabase.tooltip = 'Change Active Database';
        }
        if (!conn.database) {
            this.statusBarDatabase.text = `$(database)`;
        }
        else {
            this.statusBarDatabase.text = `$(database) ${conn.database}`;
        }
        this.statusBarDatabase.command = 'vscode-postgres.selectDatabase';
        this.statusBarDatabase.show();
    }
    removeStatusButtons() {
        if (this.statusBarDatabase)
            this.statusBarDatabase.hide();
        if (!this.statusBarServer) {
            this.statusBarServer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this.statusBarServer.tooltip = 'Change Active Server';
        }
        this.statusBarServer.text = `$(server) Select Postgres Server`;
        this.statusBarServer.command = 'vscode-postgres.selectConnection';
        this.statusBarServer.show();
    }
    onDidCloseTextDocument(e) {
        this.metadata.delete(e.uri.toString());
    }
    onDidOpenTextDocument(e) {
        this.metadata.set(e.uri.toString(), null);
    }
}
EditorState._instance = null;
exports.EditorState = EditorState;
//# sourceMappingURL=editorState.js.map