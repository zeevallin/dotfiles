"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
const fs = require("fs");
const querystring = require("querystring");
const helm_exec_1 = require("./helm.exec");
const config = require("./components/config/config");
const binutilplusplus_1 = require("./binutilplusplus");
const errorable_1 = require("./errorable");
exports.K8S_RESOURCE_SCHEME = "k8smsx";
exports.KUBECTL_RESOURCE_AUTHORITY = "loadkubernetescore";
exports.HELM_RESOURCE_AUTHORITY = "helmget";
function kubefsUri(namespace /* TODO: rationalise null and undefined */, value, outputFormat) {
    const docname = `${value.replace('/', '-')}.${outputFormat}`;
    const nonce = new Date().getTime();
    const nsquery = namespace ? `ns=${namespace}&` : '';
    const uri = `${exports.K8S_RESOURCE_SCHEME}://${exports.KUBECTL_RESOURCE_AUTHORITY}/${docname}?${nsquery}value=${value}&_=${nonce}`;
    return vscode_1.Uri.parse(uri);
}
exports.kubefsUri = kubefsUri;
class KubernetesResourceVirtualFileSystemProvider {
    constructor(kubectl, host) {
        this.kubectl = kubectl;
        this.host = host;
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
            const content = yield this.loadResource(uri);
            return new Buffer(content, 'utf8');
        });
    }
    loadResource(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = querystring.parse(uri.query);
            const outputFormat = config.getOutputFormat();
            const value = query.value;
            const ns = query.ns;
            const resourceAuthority = uri.authority;
            const eer = yield this.execLoadResource(resourceAuthority, ns, value, outputFormat);
            if (errorable_1.Errorable.failed(eer)) {
                this.host.showErrorMessage(eer.error[0]);
                throw eer.error[0];
            }
            const er = eer.result;
            if (binutilplusplus_1.ExecResult.failed(er)) {
                const message = binutilplusplus_1.ExecResult.failureMessage(er, { whatFailed: 'Get command failed' });
                if (er.resultKind === 'exec-bin-not-found') {
                    this.kubectl.promptInstallDependencies(er, message); // It doesn't matter which bincontext we go through for this  // TODO: have a shared exec context with the host, shell and fs members
                }
                else {
                    this.host.showErrorMessage(message);
                }
                throw message;
            }
            return er.stdout;
        });
    }
    execLoadResource(resourceAuthority, ns, value, outputFormat) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (resourceAuthority) {
                case exports.KUBECTL_RESOURCE_AUTHORITY:
                    const nsarg = ns ? `--namespace ${ns}` : '';
                    const ker = yield this.kubectl.invokeCommandWithFeedback(`-o ${outputFormat} ${nsarg} get ${value}`, `Loading ${value}...`);
                    return { succeeded: true, result: ker };
                case exports.HELM_RESOURCE_AUTHORITY:
                    const scopearg = ((yield helm_exec_1.helmSyntaxVersion()) === helm_exec_1.HelmSyntaxVersion.V2) ? '' : 'all';
                    const her = yield helm_exec_1.helmInvokeCommandWithFeedback(`get ${scopearg} ${value}`, `Loading ${value}...`);
                    return { succeeded: true, result: her };
                default:
                    return { succeeded: false, error: [`Internal error: please raise an issue with the error code InvalidObjectLoadURI and report authority ${resourceAuthority}.`] };
            }
        });
    }
    writeFile(uri, content, _options) {
        return this.saveAsync(uri, content); // TODO: respect options
    }
    saveAsync(uri, content) {
        return __awaiter(this, void 0, void 0, function* () {
            // This assumes no pathing in the URI - if this changes, we'll need to
            // create subdirectories.
            // TODO: not loving prompting as part of the write when it should really be part of a separate
            // 'save' workflow - but needs must, I think
            const rootPath = yield this.host.selectRootFolder();
            if (!rootPath) {
                return;
            }
            const fspath = path.join(rootPath, uri.fsPath);
            fs.writeFileSync(fspath, content);
        });
    }
    delete(_uri, _options) {
        // no-op
    }
    rename(_oldUri, _newUri, _options) {
        // no-op
    }
}
exports.KubernetesResourceVirtualFileSystemProvider = KubernetesResourceVirtualFileSystemProvider;
//# sourceMappingURL=kuberesources.virtualfs.js.map