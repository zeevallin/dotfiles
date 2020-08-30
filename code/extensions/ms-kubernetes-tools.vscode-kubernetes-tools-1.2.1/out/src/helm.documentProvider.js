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
const vscode = require("vscode");
const filepath = require("path");
const exec = require("./helm.exec");
const YAML = require("yamljs");
const fs = require("./wsl-fs");
const lodash_1 = require("lodash");
const helm = require("./helm");
const logger = require("./logger");
const errorable_1 = require("./errorable");
function htmlTag(tag, content) {
    const htmlContent = lodash_1.escape(content);
    return `<${tag}>${htmlContent}</${tag}>`;
}
function render(document) {
    const subtitle = document.subtitle ? htmlTag('h2', document.subtitle) : '';
    const bodyTag = document.isErrorOutput ? 'p' : 'pre';
    const bodyContent = htmlTag(bodyTag, document.content);
    return `<body>
      <h1>${document.title}</h1>
      ${subtitle}
      ${bodyContent}
    </body>`;
}
function extractChartName(uri) {
    if (uri.authority === helm.INSPECT_REPO_AUTHORITY) {
        const id = uri.path.substring(1);
        const version = uri.query;
        return `${id} ${version}`;
    }
    if (uri.authority === helm.INSPECT_FILE_AUTHORITY) {
        const fsPath = uri.query;
        if (filepath.extname(fsPath) === ".tgz") {
            return filepath.basename(fsPath);
        }
    }
    return "Chart";
}
class HelmInspectDocumentProvider {
    provideTextDocumentContent(uri, _token) {
        return new Promise((resolve, reject) => {
            const printer = (code, out, err) => {
                if (code === 0) {
                    const p = extractChartName(uri);
                    const title = "Inspect " + p;
                    resolve(render({ title: title, content: out, isErrorOutput: false }));
                    return;
                }
                console.log(`Inspect failed: ${out} ${err}`);
                reject(err);
            };
            if (uri.authority === helm.INSPECT_FILE_AUTHORITY) {
                // currently always INSPECT_VALUES_SCHEME
                const file = uri.query;
                const fi = fs.statSync(file);
                if (!fi.isDirectory() && filepath.extname(file) === ".tgz") {
                    exec.helmExec(`inspect values "${file}"`, printer);
                    return;
                }
                else if (fi.isDirectory() && fs.existsSync(filepath.join(file, "Chart.yaml"))) {
                    exec.helmExec(`inspect values "${file}"`, printer);
                    return;
                }
                exec.pickChartForFile(file, { warnIfNoCharts: true }, (path) => {
                    exec.helmExec(`inspect values "${path}"`, printer);
                });
            }
            else if (uri.authority === helm.INSPECT_REPO_AUTHORITY) {
                const id = uri.path.substring(1);
                const version = uri.query;
                const versionArg = version ? `--version ${version}` : '';
                exec.helmSyntaxVersion().then((sv) => {
                    const helm3Scope = (sv === exec.HelmSyntaxVersion.V2) ? '' : 'all';
                    if (uri.scheme === helm.INSPECT_CHART_SCHEME) {
                        exec.helmExec(`inspect ${helm3Scope} ${id} ${versionArg}`, printer);
                    }
                    else if (uri.scheme === helm.INSPECT_VALUES_SCHEME) {
                        exec.helmExec(`inspect values ${id} ${versionArg}`, printer);
                    }
                });
            }
        });
    }
}
exports.HelmInspectDocumentProvider = HelmInspectDocumentProvider;
// Provide an HTML-formatted preview window.
class HelmTemplatePreviewDocumentProvider {
    constructor() {
        this.onDidChangeEmitter = new vscode.EventEmitter();
    }
    get onDidChange() {
        return this.onDidChangeEmitter.event;
    }
    update(uri) {
        this.onDidChangeEmitter.fire(uri);
    }
    provideTextDocumentContent(_uri, _token) {
        return new Promise((resolve) => {
            // The URI is the encapsulated path to the template to render.
            if (!vscode.window.activeTextEditor) {
                logger.helm.log("FIXME: no editor selected");
                return;
            }
            const tpl = vscode.window.activeTextEditor.document.fileName;
            exec.helmSyntaxVersion().then((v) => {
                // First, we need to get the top-most chart:
                exec.pickChartForFile(tpl, { warnIfNoCharts: true }, (chartPath) => {
                    // We need the relative path for 'helm template'
                    if (!fs.statSync(chartPath).isDirectory()) {
                        chartPath = filepath.dirname(chartPath);
                    }
                    const reltpl = filepath.relative(chartPath, tpl);
                    const notesarg = (tpl.toLowerCase().endsWith('notes.txt')) ? '--notes' : '';
                    const displayResultAfterCommandExecution = (code, out, err) => {
                        if (code !== 0) {
                            const errorDoc = { title: "Chart Preview", subtitle: "Failed template call", content: err, isErrorOutput: true };
                            resolve(render(errorDoc));
                            return;
                        }
                        if (filepath.basename(reltpl) !== "NOTES.txt") {
                            try {
                                YAML.parse(out);
                            }
                            catch (e) {
                                // TODO: Figure out the best way to display this message, but have it go away when the
                                // file parses correctly.
                                vscode.window.showErrorMessage(`YAML failed to parse: ${e.message}`);
                            }
                        }
                        const previewDoc = out ?
                            { title: reltpl, content: out, isErrorOutput: false } :
                            { title: reltpl, content: 'Helm template produced no output', isErrorOutput: true };
                        resolve(render(previewDoc));
                    };
                    if (v === exec.HelmSyntaxVersion.V3) {
                        exec.helmExec(`template "${chartPath}" --show-only "${reltpl}" ${notesarg}`, displayResultAfterCommandExecution);
                    }
                    else {
                        exec.helmExec(`template "${chartPath}" --execute "${reltpl}" ${notesarg}`, displayResultAfterCommandExecution);
                    }
                });
            });
        });
    }
}
exports.HelmTemplatePreviewDocumentProvider = HelmTemplatePreviewDocumentProvider;
class HelmDependencyDocumentProvider {
    provideTextDocumentContent(uri, _token) {
        return this.provideTextDocumentContentImpl(uri);
    }
    provideTextDocumentContentImpl(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const chartId = uri.path.substring(1);
            const version = uri.query;
            const dependencies = yield exec.helmDependenciesCore(chartId, version);
            if (errorable_1.failed(dependencies)) {
                return `<p>${dependencies.error[0]}</p>`;
            }
            const list = dependencies.result
                .map(this.formatDependency)
                .join('<br>');
            return `<p>${chartId} depends on:</p><ul>${list}</ul>`;
        });
    }
    formatDependency(d) {
        const name = d.name;
        const version = d.version === '*' ? '' : ` (v${d.version})`;
        const repoPrefix = d.repository.startsWith('alias:') ? d.repository.substring('alias:'.length) + '/' : '';
        const repoSuffix = d.repository.startsWith('alias:') ? '' : ` from ${d.repository}`;
        const status = ` - ${d.status}`;
        return `<li>${repoPrefix}${name}${version}${repoSuffix}${status}</li>`;
    }
}
exports.HelmDependencyDocumentProvider = HelmDependencyDocumentProvider;
//# sourceMappingURL=helm.documentProvider.js.map