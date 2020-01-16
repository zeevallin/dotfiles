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
const vscode_1 = require("vscode");
const path = require("path");
const fs = require("fs");
const querystring = require("querystring");
exports.K8S_LOGS_RESOURCE_SCHEME = "k8smslogs";
exports.K8S_LOGS_RESOURCE_AUTHORITY = "kuberneteslogs";
function kubelogsfsUri(namespace, value) {
    const docname = `${value.replace('/', '-')}.log`;
    const nonce = new Date().getTime();
    const nsquery = namespace ? `ns=${namespace}&` : '';
    const uri = `${exports.K8S_LOGS_RESOURCE_SCHEME}://${exports.K8S_LOGS_RESOURCE_AUTHORITY}/${docname}?${nsquery}value=${value}&_=${nonce}`;
    return vscode_1.Uri.parse(uri);
}
exports.kubelogsfsUri = kubelogsfsUri;
class KubernetesLogsVirtualFileSystemProvider {
    constructor(kubectl, host, rootPath) {
        this.kubectl = kubectl;
        this.host = host;
        this.rootPath = rootPath;
        this.onDidChangeFileEmitter = new vscode_1.EventEmitter();
        this.onDidChangeFile = this.onDidChangeFileEmitter.event;
    }
    watch(_uri, _options) {
        // It would be quite neat to implement this to watch for changes
        // in the cluster and update the doc accordingly.  But that is very
        // definitely a future enhancement thing!
        return new vscode_1.Disposable(() => { });
    }
    stat(_uri) {
        return {
            type: vscode_1.FileType.File,
            ctime: 0,
            mtime: 0,
            size: 65536 // These files don't seem to matter for us
        };
    }
    readDirectory(_uri) {
        return [];
    }
    createDirectory(_uri) {
        // no-op
    }
    readFile(uri) {
        return this.readFileAsync(uri);
    }
    readFileAsync(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield this.loadLogs(uri);
            return new Buffer(content, 'utf8');
        });
    }
    loadLogs(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = querystring.parse(uri.query);
            const value = query.value;
            const ns = query.ns;
            const sr = yield this.execLoadLogs(ns, value);
            if (!sr || sr.code !== 0) {
                const message = 'Logs command failed: ' + (sr ? sr.stderr : "Unable to run kubectl");
                this.host.showErrorMessage(message);
                throw message;
            }
            return sr.stdout;
        });
    }
    execLoadLogs(ns, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const nsarg = ns ? `--namespace ${ns}` : '';
            return yield this.kubectl.invokeAsyncWithProgress(`logs ${value} ${nsarg}`, `Loading logs for ${value}...`);
        });
    }
    writeFile(uri, content, _options) {
        // This assumes no pathing in the URI - if this changes, we'll need to
        // create subdirectories.
        const fspath = path.join(this.rootPath, uri.fsPath);
        fs.writeFileSync(fspath, content);
    }
    delete(_uri, _options) {
        // no-op
    }
    rename(_oldUri, _newUri, _options) {
        // no-op
    }
}
exports.KubernetesLogsVirtualFileSystemProvider = KubernetesLogsVirtualFileSystemProvider;
//# sourceMappingURL=logs.virtualfs.js.map