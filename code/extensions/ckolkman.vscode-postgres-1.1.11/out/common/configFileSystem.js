'use strict';
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
const global_1 = require("./global");
const constants_1 = require("./constants");
const treeProvider_1 = require("../tree/treeProvider");
// writeFile (uri, buffer.from(), {create: true, overwrite: true})
class ConfigFile {
    constructor(name) {
        this.type = vscode.FileType.File;
        this.ctime = Date.now();
        this.mtime = Date.now();
        this.size = 0;
        this.name = name;
    }
}
exports.ConfigFile = ConfigFile;
class ConfigFS {
    constructor() {
        this._emitter = new vscode.EventEmitter();
        this._bufferedEvents = [];
        this.onDidChangeFile = this._emitter.event;
    }
    _fireSoon(...events) {
        clearTimeout(this._fireSoonHandle);
        this._bufferedEvents.push(...events);
        this._fireSoonHandle = setTimeout(() => {
            this._emitter.fire(this._bufferedEvents);
            this._bufferedEvents.length = 0;
        }, 5);
    }
    watch(resource, opts) {
        // ignore
        return new vscode.Disposable(() => { });
    }
    stat(uri) {
        return this._lookup(uri, false);
    }
    readDirectory(uri) {
        // no reading of directories - managed via connection explorer
        return [];
    }
    createDirectory(uri) {
        throw vscode.FileSystemError.NoPermissions('Unable to create pg-config directories');
    }
    readFile(uri) {
        return this._lookup(uri, false).then(value => value.data);
    }
    writeFile(uri, content, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let connFile = uri.path.substr(1);
            let fileExt = path.posix.extname(connFile);
            if (fileExt !== '.json') {
                throw vscode.FileSystemError.FileNotFound(uri);
            }
            let connectionKey = path.posix.basename(connFile, fileExt);
            const connections = global_1.Global.context.globalState.get(constants_1.Constants.GlobalStateKey);
            if (!connections || !connections.hasOwnProperty(connectionKey))
                throw vscode.FileSystemError.FileNotFound(uri);
            let newDetails = JSON.parse(content.toString());
            if (!newDetails.host)
                throw vscode.FileSystemError.NoPermissions(`Missing "host" key`);
            if (!newDetails.user)
                throw vscode.FileSystemError.NoPermissions(`Missing "user" key`);
            if (!newDetails.port)
                throw vscode.FileSystemError.NoPermissions(`Missing "port" key`);
            if (!newDetails.hasOwnProperty('password'))
                throw vscode.FileSystemError.NoPermissions(`Missing "password" key`);
            let pwd = newDetails.password;
            delete newDetails.password;
            let connection = Object.assign({}, newDetails);
            connection.hasPassword = !!pwd;
            connections[connectionKey] = connection;
            const tree = treeProvider_1.PostgreSQLTreeDataProvider.getInstance();
            if (connection.hasPassword) {
                yield global_1.Global.keytar.setPassword(constants_1.Constants.ExtensionId, connectionKey, pwd);
            }
            yield global_1.Global.context.globalState.update(constants_1.Constants.GlobalStateKey, connections);
            tree.refresh();
            this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
        });
    }
    delete(uri) {
        throw vscode.FileSystemError.NoPermissions('Unable to delete pg-config entries');
    }
    rename(oldUri, newUri, options) {
        throw vscode.FileSystemError.NoPermissions('Unable to rename pg-config entries');
    }
    _lookup(uri, silent) {
        return __awaiter(this, void 0, void 0, function* () {
            let connFile = uri.path.substr(1);
            let fileExt = path.posix.extname(connFile);
            if (fileExt !== '.json') {
                if (!silent)
                    throw vscode.FileSystemError.FileNotFound(uri);
                return null;
            }
            let connectionKey = path.posix.basename(connFile, fileExt);
            let configFile = null;
            const connections = global_1.Global.context.globalState.get(constants_1.Constants.GlobalStateKey);
            if (connections && connections.hasOwnProperty(connectionKey)) {
                // create the file
                let connection = Object.assign({}, connections[connectionKey]);
                if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
                    connection.password = yield global_1.Global.keytar.getPassword(constants_1.Constants.ExtensionId, connectionKey);
                }
                else {
                    connection.password = "";
                }
                delete connection.hasPassword;
                let connString = JSON.stringify(connection, null, 2);
                configFile = new ConfigFile(connection.label || connection.host);
                configFile.data = Buffer.from(connString);
            }
            if (!configFile && !silent)
                throw vscode.FileSystemError.FileNotFound(uri);
            return configFile;
        });
    }
}
exports.ConfigFS = ConfigFS;
//# sourceMappingURL=configFileSystem.js.map