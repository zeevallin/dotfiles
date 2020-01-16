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
const path = require("path");
const vscode = require("vscode");
const _ = require("lodash");
const helm = require("./helm.exec");
const helm_1 = require("./helm");
const errorable_1 = require("./errorable");
const outputUtils_1 = require("./outputUtils");
const config_1 = require("./components/config/config");
exports.HELM_EXPLORER_NODE_CATEGORY = 'helm-explorer-node';
function create(host) {
    return new HelmRepoExplorer(host);
}
exports.create = create;
var RepoExplorerObjectKind;
(function (RepoExplorerObjectKind) {
    RepoExplorerObjectKind[RepoExplorerObjectKind["Repo"] = 0] = "Repo";
    RepoExplorerObjectKind[RepoExplorerObjectKind["Chart"] = 1] = "Chart";
    RepoExplorerObjectKind[RepoExplorerObjectKind["ChartVersion"] = 2] = "ChartVersion";
    RepoExplorerObjectKind[RepoExplorerObjectKind["Error"] = 3] = "Error";
})(RepoExplorerObjectKind = exports.RepoExplorerObjectKind || (exports.RepoExplorerObjectKind = {}));
function isHelmRepo(o) {
    return !!o && o.kind === RepoExplorerObjectKind.Repo;
}
exports.isHelmRepo = isHelmRepo;
function isHelmRepoChart(o) {
    return !!o && o.kind === RepoExplorerObjectKind.Chart;
}
exports.isHelmRepoChart = isHelmRepoChart;
function isHelmRepoChartVersion(o) {
    return !!o && o.kind === RepoExplorerObjectKind.ChartVersion;
}
exports.isHelmRepoChartVersion = isHelmRepoChartVersion;
class HelmRepoExplorer {
    constructor(host) {
        this.onDidChangeTreeDataEmitter = new vscode.EventEmitter();
        this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
        host.onDidChangeConfiguration((change) => {
            if (config_1.affectsUs(change)) {
                this.refresh();
            }
        });
    }
    getTreeItem(element) {
        return element.getTreeItem();
    }
    getChildren(parent) {
        if (parent) {
            return parent.getChildren();
        }
        return this.getHelmRepos();
    }
    getHelmRepos() {
        return __awaiter(this, void 0, void 0, function* () {
            const repos = yield listHelmRepos();
            if (errorable_1.failed(repos)) {
                return [new HelmError('Unable to list Helm repos', repos.error[0])];
            }
            return repos.result;
        });
    }
    refresh() {
        return __awaiter(this, void 0, void 0, function* () {
            yield helm.helmExecAsync('repo update');
            this.onDidChangeTreeDataEmitter.fire();
        });
    }
}
exports.HelmRepoExplorer = HelmRepoExplorer;
class HelmExplorerNodeImpl {
    constructor() {
        this.nodeCategory = exports.HELM_EXPLORER_NODE_CATEGORY;
    }
}
class HelmError extends HelmExplorerNodeImpl {
    constructor(text, detail) {
        super();
        this.text = text;
        this.detail = detail;
    }
    get kind() { return RepoExplorerObjectKind.Error; }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.text);
        treeItem.tooltip = this.detail;
        return treeItem;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
}
class HelmRepoImpl extends HelmExplorerNodeImpl {
    constructor(name) {
        super();
        this.name = name;
    }
    get kind() { return RepoExplorerObjectKind.Repo; }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.name, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.iconPath = {
            light: vscode.Uri.file(path.join(__dirname, "../../images/light/helm-blue-vector.svg")),
            dark: vscode.Uri.file(path.join(__dirname, "../../images/dark/helm-white-vector.svg")),
        };
        treeItem.contextValue = 'vsKubernetes.repo';
        return treeItem;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            const charts = yield listHelmRepoCharts(this.name);
            if (errorable_1.failed(charts)) {
                return [new HelmError('Error fetching charts', charts.error[0])];
            }
            return charts.result;
        });
    }
}
class HelmRepoChartImpl extends HelmExplorerNodeImpl {
    constructor(repoName, id, content) {
        super();
        this.id = id;
        this.versions = content.map((e) => new HelmRepoChartVersionImpl(id, e['chart version'], e['app version'], e.description));
        this.name = id.substring(repoName.length + 1);
    }
    get kind() { return RepoExplorerObjectKind.Chart; }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.name, vscode.TreeItemCollapsibleState.Collapsed);
        treeItem.contextValue = 'vsKubernetes.chart';
        return treeItem;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.versions;
        });
    }
}
class HelmRepoChartVersionImpl extends HelmExplorerNodeImpl {
    constructor(id, version, appVersion, description) {
        super();
        this.id = id;
        this.version = version;
        this.appVersion = appVersion;
        this.description = description;
    }
    get kind() { return RepoExplorerObjectKind.ChartVersion; }
    getTreeItem() {
        const treeItem = new vscode.TreeItem(this.version);
        treeItem.tooltip = this.tooltip();
        treeItem.command = {
            command: "extension.helmInspectChart",
            title: "Inspect",
            arguments: [this]
        };
        treeItem.contextValue = 'vsKubernetes.chartversion';
        return treeItem;
    }
    getChildren() {
        return __awaiter(this, void 0, void 0, function* () {
            return [];
        });
    }
    tooltip() {
        const tooltipLines = [this.description ? this.description : 'No description available'];
        if (this.appVersion) {
            tooltipLines.push(`App version: ${this.appVersion}`);
        }
        return tooltipLines.join('\n');
    }
}
function listHelmRepos() {
    return __awaiter(this, void 0, void 0, function* () {
        const sr = yield helm.helmExecAsync("repo list");
        // TODO: prompt to run 'helm init' here if needed...
        if (!sr || sr.code !== 0) {
            return { succeeded: false, error: [sr ? sr.stderr : "Unable to run Helm"] };
        }
        const repos = sr.stdout.split('\n')
            .slice(1)
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
            .map((l) => l.split('\t').map((bit) => bit.trim()))
            .map((bits) => new HelmRepoImpl(bits[0]));
        return { succeeded: true, result: repos };
    });
}
function listHelmRepoCharts(repoName) {
    return __awaiter(this, void 0, void 0, function* () {
        const syntaxVersion = yield helm.helmSyntaxVersion();
        const searchCmd = (syntaxVersion === helm.HelmSyntaxVersion.V3) ? 'search repo' : 'search';
        const sr = yield helm.helmExecAsync(`${searchCmd} ${repoName}/ -l`);
        if (!sr || sr.code !== 0) {
            return { succeeded: false, error: [sr ? sr.stderr : "Unable to run Helm"] };
        }
        const lines = sr.stdout.split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        const rawEntries = outputUtils_1.parseLineOutput(lines, helm_1.HELM_OUTPUT_COLUMN_SEPARATOR);
        // Charts can embed newlines in their descriptions. We need to merge
        // 'entries' that are actually continuations with their 'parents.'
        const entries = mergeContinuationEntries(rawEntries);
        const charts = _.chain(entries)
            .groupBy((e) => e.name)
            .toPairs()
            .map((p) => new HelmRepoChartImpl(repoName, p[0], p[1]))
            .value();
        return { succeeded: true, result: charts };
    });
}
function mergeContinuationEntries(entries) {
    const result = Array.of();
    for (const entry of entries) {
        if (Object.keys(entry).length === 1) {
            // It's a continuation - merge it with the last entry that wasn't a continuation
            mergeEntry(result[result.length - 1], entry);
        }
        else {
            // It's a new entry - push it
            result.push(entry);
        }
    }
    return result;
}
function mergeEntry(mergeInto, mergeFrom) {
    // Because we trim the output lines, continuation descriptions land in
    // the 'name' field
    mergeInto['description'] = `${mergeInto['description'].trim()} ${mergeFrom['name']}`;
}
//# sourceMappingURL=helm.repoExplorer.js.map