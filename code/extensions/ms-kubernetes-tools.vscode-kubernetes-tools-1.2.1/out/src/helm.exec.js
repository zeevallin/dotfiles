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
const _ = require("lodash");
const filepath = require("path");
const tmp = require("tmp");
const vscode = require("vscode");
const YAML = require("yamljs");
const binutilplusplus_1 = require("./binutilplusplus");
const explorer_1 = require("./components/clusterexplorer/explorer");
const explorer_2 = require("./components/clusterprovider/common/explorer");
const config_1 = require("./components/config/config");
const installdependencies_1 = require("./components/installer/installdependencies");
const errorable_1 = require("./errorable");
const fs_1 = require("./fs");
const helm = require("./helm");
const helmrepoexplorer = require("./helm.repoExplorer");
const host_1 = require("./host");
const hostutils_1 = require("./hostutils");
const kubectlUtils_1 = require("./kubectlUtils");
const kuberesources_virtualfs_1 = require("./kuberesources.virtualfs");
const logger_1 = require("./logger");
const outputUtils_1 = require("./outputUtils");
const shell_1 = require("./shell");
const preview_1 = require("./utils/preview");
const fs = require("./wsl-fs");
var EnsureMode;
(function (EnsureMode) {
    EnsureMode[EnsureMode["Alert"] = 0] = "Alert";
    EnsureMode[EnsureMode["Silent"] = 1] = "Silent";
})(EnsureMode = exports.EnsureMode || (exports.EnsureMode = {}));
// This file contains utilities for executing command line tools, notably Helm.
function helmVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const syntaxVersion = yield helmSyntaxVersion();
        const versionArgs = (syntaxVersion === HelmSyntaxVersion.V3) ? '' : '-c';
        const sr = yield helmExecAsync(`version ${versionArgs}`);
        if (!sr) {
            vscode.window.showErrorMessage('Failed to run Helm');
            return;
        }
        if (sr.code !== 0) {
            vscode.window.showErrorMessage(sr.stderr);
            return;
        }
        vscode.window.showInformationMessage(sr.stdout);
    });
}
exports.helmVersion = helmVersion;
var HelmSyntaxVersion;
(function (HelmSyntaxVersion) {
    HelmSyntaxVersion[HelmSyntaxVersion["Unknown"] = 1] = "Unknown";
    HelmSyntaxVersion[HelmSyntaxVersion["V2"] = 2] = "V2";
    HelmSyntaxVersion[HelmSyntaxVersion["V3"] = 3] = "V3";
})(HelmSyntaxVersion = exports.HelmSyntaxVersion || (exports.HelmSyntaxVersion = {}));
let cachedVersion = undefined;
function helmSyntaxVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cachedVersion === undefined) {
            const srHelm2 = yield helmExecAsync(`version --short -c`);
            if (!srHelm2) {
                // failed to run Helm; do not cache result
                return HelmSyntaxVersion.Unknown;
            }
            if (srHelm2.code === 0 && srHelm2.stdout.indexOf('v2') >= 0) {
                cachedVersion = HelmSyntaxVersion.V2;
            }
            else {
                const srHelm3 = yield helmExecAsync(`version --short`);
                if (srHelm3 && srHelm3.code === 0 && srHelm3.stdout.indexOf('v3') >= 0) {
                    cachedVersion = HelmSyntaxVersion.V3;
                }
                else {
                    return HelmSyntaxVersion.Unknown;
                }
            }
        }
        return cachedVersion;
    });
}
exports.helmSyntaxVersion = helmSyntaxVersion;
// Run a 'helm template' command.
// This looks for Chart.yaml files in the present project. If only one is found, it
// runs 'helm template' on it. If multiples are found, it prompts the user to select one.
function helmTemplate() {
    pickChart((path) => {
        helmExec(`template "${path}"`, (code, out, err) => {
            if (code !== 0) {
                vscode.window.showErrorMessage(err);
                return;
            }
            vscode.window.showInformationMessage("chart rendered successfully");
            logger_1.helm.log(out);
        });
    });
}
exports.helmTemplate = helmTemplate;
function helmTemplatePreview() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("No active editor.");
        return;
    }
    const filePath = editor.document.fileName;
    if (filePath.indexOf("templates") < 0) {
        vscode.window.showInformationMessage("Not a template: " + filePath);
        return;
    }
    if (!ensureHelm(EnsureMode.Alert)) {
        return;
    }
    const u = vscode.Uri.parse(helm.PREVIEW_URI);
    const f = filepath.basename(filePath);
    preview_1.preview(u, vscode.ViewColumn.Two, `Preview ${f}`);
    helm.recordPreviewHasBeenShown();
}
exports.helmTemplatePreview = helmTemplatePreview;
function helmDepUp(arg /* Uri | TextDocument | undefined */) {
    if (!arg) {
        pickChart((path) => helmDepUpCore(path));
        return;
    }
    const uri = arg.uri || arg;
    if (uri.scheme !== 'file') {
        vscode.window.showErrorMessage('Chart is not on the filesystem');
        return;
    }
    const path = filepath.dirname(uri.fsPath);
    helmDepUpCore(path);
}
exports.helmDepUp = helmDepUp;
function helmDepUpCore(path) {
    logger_1.helm.log("⎈⎈⎈ Updating dependencies for " + path);
    helmExec(`dep up "${path}"`, (code, out, err) => {
        logger_1.helm.log(out);
        logger_1.helm.log(err);
        if (code !== 0) {
            logger_1.helm.log("⎈⎈⎈ UPDATE FAILED");
        }
    });
}
function helmCreate() {
    return __awaiter(this, void 0, void 0, function* () {
        const createResult = yield helmCreateCore("Chart name", "mychart");
        if (createResult && errorable_1.failed(createResult)) {
            vscode.window.showErrorMessage(createResult.error[0]);
        }
    });
}
exports.helmCreate = helmCreate;
function helmCreateCore(prompt, sampleName) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = yield hostutils_1.showWorkspaceFolderPick();
        if (!folder) {
            return undefined;
        }
        const name = yield vscode.window.showInputBox({
            prompt: prompt,
            placeHolder: sampleName
        });
        if (!name) {
            return undefined;
        }
        const fullpath = filepath.join(folder.uri.fsPath, name);
        const sr = yield helmExecAsync(`create "${fullpath}"`);
        if (!sr || sr.code !== 0) {
            return { succeeded: false, error: [sr ? sr.stderr : "Unable to run Helm"] };
        }
        return { succeeded: true, result: { name: name, path: fullpath } };
    });
}
exports.helmCreateCore = helmCreateCore;
// helmLint runs the Helm linter on a chart within your project.
function helmLint() {
    pickChart((path) => {
        logger_1.helm.log("⎈⎈⎈ Linting " + path);
        helmExec(`lint "${path}"`, (code, out, err) => {
            logger_1.helm.log(out);
            logger_1.helm.log(err);
            if (code !== 0) {
                logger_1.helm.log("⎈⎈⎈ LINTING FAILED");
            }
        });
    });
}
exports.helmLint = helmLint;
function helmInspectValues(arg) {
    helmInspect(arg, {
        noTargetMessage: "Helm Inspect Values is for packaged charts and directories. Launch the command from a file or directory in the file explorer. or a chart or version in the Helm Repos explorer.",
        inspectionScheme: helm.INSPECT_VALUES_SCHEME
    });
}
exports.helmInspectValues = helmInspectValues;
function helmInspectChart(arg) {
    helmInspect(arg, {
        noTargetMessage: "Helm Inspect Chart is for packaged charts and directories. Launch the command from a chart or version in the Helm Repos explorer.",
        inspectionScheme: helm.INSPECT_CHART_SCHEME
    });
}
exports.helmInspectChart = helmInspectChart;
function helmInspect(arg, s) {
    if (!arg) {
        vscode.window.showErrorMessage(s.noTargetMessage);
        return;
    }
    if (!ensureHelm(EnsureMode.Alert)) {
        return;
    }
    if (helmrepoexplorer.isHelmRepoChart(arg) || helmrepoexplorer.isHelmRepoChartVersion(arg)) {
        const id = arg.id;
        const versionQuery = helmrepoexplorer.isHelmRepoChartVersion(arg) ? `?${arg.version}` : '';
        const uri = vscode.Uri.parse(`${s.inspectionScheme}://${helm.INSPECT_REPO_AUTHORITY}/${id}${versionQuery}`);
        preview_1.preview(uri, vscode.ViewColumn.Two, "Inspect");
    }
    else {
        const u = arg;
        const uri = vscode.Uri.parse(`${s.inspectionScheme}://${helm.INSPECT_FILE_AUTHORITY}/?${u.fsPath}`);
        preview_1.preview(uri, vscode.ViewColumn.Two, "Inspect");
    }
}
// helmDryRun runs a helm install with --dry-run and --debug set.
function helmDryRun() {
    pickChart((path) => __awaiter(this, void 0, void 0, function* () {
        const syntaxVersion = yield helmSyntaxVersion();
        const generateNameArg = (syntaxVersion === HelmSyntaxVersion.V3) ? '--generate-name' : '';
        logger_1.helm.log("⎈⎈⎈ Installing (dry-run) " + path);
        helmExec(`install --dry-run ${generateNameArg} --debug "${path}"`, (code, out, err) => {
            logger_1.helm.log(out);
            logger_1.helm.log(err);
            if (code !== 0) {
                logger_1.helm.log("⎈⎈⎈ INSTALL FAILED");
            }
        });
    }));
}
exports.helmDryRun = helmDryRun;
function helmGet(resourceNode) {
    if (!resourceNode) {
        return;
    }
    if (resourceNode.nodeType !== explorer_1.NODE_TYPES.helm.history &&
        resourceNode.nodeType !== explorer_1.NODE_TYPES.helm.release) {
        return;
    }
    const releaseName = resourceNode.releaseName;
    const uri = helmfsUri(releaseName);
    vscode.workspace.openTextDocument(uri).then((doc) => {
        if (doc) {
            vscode.window.showTextDocument(doc);
        }
    });
}
exports.helmGet = helmGet;
function helmUninstall(resourceNode) {
    if (!resourceNode) {
        return;
    }
    if (resourceNode.nodeType !== explorer_1.NODE_TYPES.helm.release) {
        return;
    }
    const releaseName = resourceNode.releaseName;
    logger_1.helm.log("⎈⎈⎈ Uninstalling " + releaseName);
    vscode.window.showWarningMessage(`You are about to uninstall ${releaseName}. This action cannot be undone.`, 'Uninstall').then((opt) => {
        if (opt === "Uninstall") {
            helmExec(`del ${releaseName}`, (code, out, err) => {
                logger_1.helm.log(out);
                logger_1.helm.log(err);
                if (code !== 0) {
                    logger_1.helm.log("⎈⎈⎈ UNINSTALL FAILED");
                    vscode.window.showErrorMessage(`Error uninstalling ${releaseName} ${err}`);
                }
                else {
                    vscode.window.showInformationMessage(`Release ${releaseName} successfully uninstalled.`);
                    explorer_2.refreshExplorer();
                }
            });
        }
    });
}
exports.helmUninstall = helmUninstall;
function helmGetHistory(release) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ensureHelm(EnsureMode.Alert)) {
            return { succeeded: false, error: ["Helm client is not installed"] };
        }
        const releases = [];
        const sr = yield helmExecAsync(`history ${release} --output json`);
        if (!sr || sr.code !== 0) {
            yield vscode.window.showErrorMessage(`Helm fetch history failed: ${sr ? sr.stderr : "Unable to run Helm"}`);
        }
        else {
            const hist = JSON.parse(sr.stdout);
            releases.push(...hist);
        }
        return { succeeded: true, result: releases.reverse() };
    });
}
exports.helmGetHistory = helmGetHistory;
function helmRollback(resourceNode) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!resourceNode) {
            return;
        }
        if (resourceNode.status === "deployed") {
            vscode.window.showInformationMessage('This is the currently deployed release');
            return;
        }
        const releaseName = resourceNode.releaseName;
        vscode.window.showWarningMessage(`You are about to rollback ${releaseName} to release version ${resourceNode.revision}. Continue?`, 'Rollback').then((opt) => {
            if (opt === "Rollback") {
                helmExec(`rollback ${releaseName} ${resourceNode.revision} --cleanup-on-fail`, (code, out, err) => __awaiter(this, void 0, void 0, function* () {
                    logger_1.helm.log(out);
                    logger_1.helm.log(err);
                    if (out !== "") {
                        vscode.window.showInformationMessage(`Release ${releaseName} successfully rolled back to ${resourceNode.revision}.`);
                        explorer_2.refreshExplorer();
                    }
                    if (code !== 0) {
                        vscode.window.showErrorMessage(`Error rolling back to ${resourceNode.revision} for ${releaseName} ${err}`);
                    }
                }));
            }
        });
    });
}
exports.helmRollback = helmRollback;
function helmfsUri(releaseName) {
    const docname = `helmrelease-${releaseName}.txt`;
    const nonce = new Date().getTime();
    const uri = `${kuberesources_virtualfs_1.K8S_RESOURCE_SCHEME}://${kuberesources_virtualfs_1.HELM_RESOURCE_AUTHORITY}/${docname}?value=${releaseName}&_=${nonce}`;
    return vscode.Uri.parse(uri);
}
exports.helmfsUri = helmfsUri;
// helmPackage runs the Helm package on a chart within your project.
function helmPackage() {
    pickChart((path) => {
        const options = { openLabel: "Save Package", canSelectFiles: false, canSelectFolders: true, canSelectMany: false };
        vscode.window.showOpenDialog(options).then((packagePath) => {
            if (packagePath && packagePath.length === 1) {
                if (packagePath[0].scheme !== 'file') {
                    vscode.window.showErrorMessage('Packaging folder must be a filesystem folder');
                    return;
                }
                logger_1.helm.log("⎈⎈⎈ Packaging " + path);
                helmExec(`package "${path}" -d "${packagePath[0].fsPath}"`, (code, out, err) => {
                    logger_1.helm.log(out);
                    logger_1.helm.log(err);
                    if (code !== 0) {
                        vscode.window.showErrorMessage(err);
                    }
                });
            }
            return;
        });
    });
}
exports.helmPackage = helmPackage;
function helmFetch(helmObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!helmObject) {
            const id = yield vscode.window.showInputBox({ prompt: "Chart to fetch", placeHolder: "stable/mychart" });
            if (id) {
                helmFetchCore(id, undefined);
            }
        }
        if (helmrepoexplorer.isHelmRepoChart(helmObject)) {
            yield helmFetchCore(helmObject.id, undefined);
        }
        else if (helmrepoexplorer.isHelmRepoChartVersion(helmObject)) {
            yield helmFetchCore(helmObject.id, helmObject.version);
        }
    });
}
exports.helmFetch = helmFetch;
function helmFetchCore(chartId, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const projectFolder = yield hostutils_1.showWorkspaceFolderPick();
        if (!projectFolder) {
            return;
        }
        const versionArg = version ? `--version ${version}` : '';
        const sr = yield helmExecAsync(`fetch ${chartId} --untar ${versionArg} -d "${projectFolder.uri.fsPath}"`);
        if (!sr || sr.code !== 0) {
            yield vscode.window.showErrorMessage(`Helm fetch failed: ${sr ? sr.stderr : "Unable to run Helm"}`);
            return;
        }
        yield vscode.window.showInformationMessage(`Fetched ${chartId}`);
    });
}
function helmInstall(kubectl, helmObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!helmObject) {
            const id = yield vscode.window.showInputBox({ prompt: "Chart to install", placeHolder: "stable/mychart" });
            if (id) {
                helmInstallCore(kubectl, id, undefined);
            }
        }
        if (helmrepoexplorer.isHelmRepoChart(helmObject)) {
            yield helmInstallCore(kubectl, helmObject.id, undefined);
        }
        else if (helmrepoexplorer.isHelmRepoChartVersion(helmObject)) {
            yield helmInstallCore(kubectl, helmObject.id, helmObject.version);
        }
    });
}
exports.helmInstall = helmInstall;
function helmInstallCore(kubectl, chartId, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const syntaxVersion = yield helmSyntaxVersion();
        const ns = yield kubectlUtils_1.currentNamespace(kubectl);
        const nsArg = ns ? `--namespace ${ns}` : '';
        const versionArg = version ? `--version ${version}` : '';
        const generateNameArg = (syntaxVersion === HelmSyntaxVersion.V3) ? '--generate-name' : '';
        const sr = yield helmExecAsync(`install ${chartId} ${versionArg} ${nsArg} ${generateNameArg}`);
        if (!sr || sr.code !== 0) {
            const message = sr ? sr.stderr : "Unable to run Helm";
            logger_1.helm.log(message);
            yield vscode.window.showErrorMessage(`Helm install failed: ${message}`);
            return;
        }
        const releaseName = extractReleaseName(sr.stdout);
        logger_1.helm.log(sr.stdout);
        yield vscode.window.showInformationMessage(`Installed ${chartId} as release ${releaseName}`);
    });
}
const HELM_INSTALL_NAME_HEADER = "NAME:";
function extractReleaseName(helmOutput) {
    const lines = helmOutput.split('\n').map((l) => l.trim());
    const nameLine = lines.find((l) => l.startsWith(HELM_INSTALL_NAME_HEADER));
    if (!nameLine) {
        return '(unknown)';
    }
    return nameLine.substring(HELM_INSTALL_NAME_HEADER.length + 1).trim();
}
function helmDependencies(helmObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!helmObject) {
            const id = yield vscode.window.showInputBox({ prompt: "Chart to show dependencies for", placeHolder: "stable/mychart" });
            if (id) {
                helmDependenciesLaunchViewer(id, undefined);
            }
        }
        if (helmrepoexplorer.isHelmRepoChart(helmObject)) {
            yield helmDependenciesLaunchViewer(helmObject.id, undefined);
        }
        else if (helmrepoexplorer.isHelmRepoChartVersion(helmObject)) {
            yield helmDependenciesLaunchViewer(helmObject.id, helmObject.version);
        }
    });
}
exports.helmDependencies = helmDependencies;
function helmDependenciesLaunchViewer(chartId, version) {
    return __awaiter(this, void 0, void 0, function* () {
        // Boing it back through a HTML preview window
        const versionQuery = version ? `?${version}` : '';
        const uri = vscode.Uri.parse(`${helm.DEPENDENCIES_SCHEME}://${helm.DEPENDENCIES_REPO_AUTHORITY}/${chartId}${versionQuery}`);
        yield preview_1.preview(uri, vscode.ViewColumn.Two, `${chartId} Dependencies`);
    });
}
function helmDependenciesCore(chartId, version) {
    return __awaiter(this, void 0, void 0, function* () {
        const tempDirObj = tmp.dirSync({ prefix: "vsk-fetchfordeps-", unsafeCleanup: true });
        const versionArg = version ? `--version ${version}` : '';
        const fsr = yield helmExecAsync(`fetch ${chartId} ${versionArg} -d "${tempDirObj.name}"`);
        if (!fsr || fsr.code !== 0) {
            tempDirObj.removeCallback();
            return { succeeded: false, error: [`Helm fetch failed: ${fsr ? fsr.stderr : "Unable to run Helm"}`] };
        }
        const tempDirFiles = shell_1.shell.ls(tempDirObj.name);
        const chartPath = filepath.join(tempDirObj.name, tempDirFiles[0]); // should be the only thing in the directory
        try {
            const dsr = yield helmExecAsync(`dep list "${chartPath}"`);
            if (!dsr || dsr.code !== 0) {
                return { succeeded: false, error: [`Helm dependency list failed: ${dsr ? dsr.stderr : "Unable to run Helm"}`] };
            }
            const lines = dsr.stdout.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
            if (lines.length === 1) {
                return { succeeded: false, error: [`${chartId} has no dependencies`] }; // I don't feel good about using an error for this but life is short
            }
            const dependencies = outputUtils_1.parseLineOutput(lines, helm.HELM_OUTPUT_COLUMN_SEPARATOR);
            return { succeeded: true, result: dependencies };
        }
        finally {
            fs.unlinkSync(chartPath);
            tempDirObj.removeCallback();
        }
    });
}
exports.helmDependenciesCore = helmDependenciesCore;
// pickChart tries to find charts in this repo. If one is found, fn() is executed with that
// chart's path. If more than one are found, the user is prompted to choose one, and then
// the fn is executed with that chart.
//
// callback is fn(path)
function pickChart(fn) {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("This command requires an open folder.");
        return;
    }
    vscode.workspace.findFiles("**/Chart.yaml", "", 1024).then((matches) => {
        switch (matches.length) {
            case 0:
                vscode.window.showErrorMessage("No charts found");
                return;
            case 1:
                // Assume that if there is only one chart, that's the one to run.
                const p = filepath.dirname(matches[0].fsPath);
                fn(p);
                return;
            default:
                // TODO: This would be so much cooler if the QuickPick parsed the Chart.yaml
                // and showed the chart name instead of the path.
                const pathPicks = matches.map((item) => quickPickForChart(item));
                vscode.window.showQuickPick(pathPicks).then((picked) => {
                    if (picked) {
                        fn(picked.chartDir);
                    }
                });
                return;
        }
    });
}
exports.pickChart = pickChart;
function quickPickForChart(chartUri) {
    const chartDir = filepath.dirname(chartUri.fsPath);
    const displayName = vscode.workspace.rootPath ?
        filepath.relative(vscode.workspace.rootPath, chartDir) :
        chartDir;
    return {
        label: displayName || ".",
        chartDir: chartDir
    };
}
class Chart {
}
// Load a chart object
function loadChartMetadata(chartDir) {
    const f = filepath.join(chartDir, "Chart.yaml");
    let c;
    try {
        c = YAML.load(f);
    }
    catch (err) {
        vscode.window.showErrorMessage("Chart.yaml: " + err);
    }
    return c;
}
exports.loadChartMetadata = loadChartMetadata;
// Given a file, show any charts that this file belongs to.
function pickChartForFile(file, options, fn) {
    vscode.workspace.findFiles("**/Chart.yaml", "", 1024).then((matches) => {
        switch (matches.length) {
            case 0:
                if (options.warnIfNoCharts) {
                    vscode.window.showErrorMessage("No charts found");
                }
                return;
            case 1:
                // Assume that if there is only one chart, that's the one to run.
                const p = filepath.dirname(matches[0].fsPath);
                fn(p);
                return;
            default:
                const paths = Array.of();
                matches.forEach((item) => {
                    const dirname = filepath.dirname(item.fsPath);
                    const rel = filepath.relative(dirname, file);
                    // If the present file is not in a subdirectory of the parent chart, skip the chart.
                    if (rel.indexOf("..") >= 0) {
                        return;
                    }
                    paths.push(dirname);
                });
                if (paths.length === 0) {
                    if (options.warnIfNoCharts) {
                        vscode.window.showErrorMessage("Chart not found for " + file);
                    }
                    return;
                }
                // For now, let's go with the top-most path (umbrella chart)
                if (paths.length >= 1) {
                    fn(paths[0]);
                    return;
                }
                return;
        }
    });
}
exports.pickChartForFile = pickChartForFile;
// helmExec appends 'args' to a Helm command (helm args...), executes it, and then sends the result to te callback.
// fn should take the signature function(code, stdout, stderr)
//
// This will abort and send an error message if Helm is not installed.
function helmExec(args, fn) {
    if (!ensureHelm(EnsureMode.Alert)) {
        return;
    }
    const configuredBin = config_1.getToolPath(host_1.host, shell_1.shell, 'helm');
    const bin = configuredBin ? `"${configuredBin}"` : "helm";
    const cmd = `${bin} ${args}`;
    const promise = shell_1.shell.exec(cmd);
    promise.then((res) => {
        if (res) {
            fn(res.code, res.stdout, res.stderr);
        }
        else {
            console.log('exec failed: unable to run Helm');
        }
    }, (err) => {
        console.log(`exec failed! (${err})`);
    });
}
exports.helmExec = helmExec;
function helmExecAsync(args) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: deduplicate with helmExec
        if (!ensureHelm(EnsureMode.Alert)) {
            return { code: -1, stdout: "", stderr: "" };
        }
        const configuredBin = config_1.getToolPath(host_1.host, shell_1.shell, 'helm');
        const bin = configuredBin ? `"${configuredBin}"` : "helm";
        const cmd = `${bin} ${args}`;
        return yield shell_1.shell.exec(cmd);
    });
}
exports.helmExecAsync = helmExecAsync;
const HELM_BINARY = {
    binBaseName: 'helm',
    configKeyName: 'helm',
    displayName: 'Helm',
    offersInstall: true,
};
const HELM_CONTEXT = {
    host: host_1.host,
    fs: fs_1.fs,
    shell: shell_1.shell,
    pathfinder: undefined,
    binary: HELM_BINARY,
    status: undefined,
};
function helmInvokeCommand(command) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield binutilplusplus_1.invokeForResult(HELM_CONTEXT, command, undefined);
    });
}
exports.helmInvokeCommand = helmInvokeCommand;
function helmInvokeCommandWithFeedback(command, uiOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield HELM_CONTEXT.host.longRunning(uiOptions, () => binutilplusplus_1.invokeForResult(HELM_CONTEXT, command, undefined));
    });
}
exports.helmInvokeCommandWithFeedback = helmInvokeCommandWithFeedback;
const HELM_PAGING_PREFIX = "next:";
function helmListAll(namespace) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!ensureHelm(EnsureMode.Alert)) {
            return { succeeded: false, error: ["Helm client is not installed"] };
        }
        const releases = [];
        let offset = null;
        do {
            const nsarg = namespace ? `--namespace ${namespace}` : "";
            const offsetarg = offset ? `--offset ${offset}` : "";
            const sr = yield helmExecAsync(`list --max 0 ${nsarg} ${offsetarg}`);
            if (!sr || sr.code !== 0) {
                return { succeeded: false, error: [sr ? sr.stderr : "Unable to run Helm"] };
            }
            const lines = sr.stdout.split('\n')
                .map((s) => s.trim())
                .filter((l) => l.length > 0);
            if (lines.length > 0) {
                if (lines[0].startsWith(HELM_PAGING_PREFIX)) {
                    const pagingInfo = lines.shift(); // safe because we have checked the length
                    offset = pagingInfo.substring(HELM_PAGING_PREFIX.length).trim();
                }
                else {
                    offset = null;
                }
            }
            if (lines.length > 0) {
                const helmReleases = outputUtils_1.parseLineOutput(lines, helm.HELM_OUTPUT_COLUMN_SEPARATOR);
                releases.push(...helmReleases);
            }
        } while (offset !== null);
        return { succeeded: true, result: releases };
    });
}
exports.helmListAll = helmListAll;
function ensureHelm(mode) {
    const configuredBin = config_1.getToolPath(host_1.host, shell_1.shell, 'helm');
    if (configuredBin) {
        if (fs.existsSync(configuredBin)) {
            return true;
        }
        if (mode === EnsureMode.Alert) {
            vscode.window.showErrorMessage(`${configuredBin} does not exist!`, "Install dependencies").then((str) => {
                if (str === "Install dependencies") {
                    installdependencies_1.installDependencies();
                }
            });
        }
        return false;
    }
    if (shell_1.shell.which("helm")) {
        return true;
    }
    if (mode === EnsureMode.Alert) {
        vscode.window.showErrorMessage(`Could not find Helm binary.`, "Install dependencies").then((str) => {
            if (str === "Install dependencies") {
                installdependencies_1.installDependencies();
            }
        });
    }
    return false;
}
exports.ensureHelm = ensureHelm;
class Requirement {
    toString() {
        return `- name: ${this.name}
  version: ${this.version}
  repository: ${this.repository}
`;
    }
}
exports.Requirement = Requirement;
function insertRequirement() {
    vscode.window.showInputBox({
        prompt: "Chart",
        placeHolder: "stable/redis",
    }).then((val) => {
        if (!val) {
            return;
        }
        const req = searchForChart(val);
        if (!req) {
            vscode.window.showErrorMessage(`Chart ${val} not found`);
            return;
        }
        const ed = vscode.window.activeTextEditor;
        if (!ed) {
            logger_1.helm.log(YAML.stringify(req));
            return;
        }
        ed.insertSnippet(new vscode.SnippetString(req.toString()));
    });
}
exports.insertRequirement = insertRequirement;
// searchForChart takes a 'repo/name' and returns an entry suitable for requirements
function searchForChart(name) {
    const parts = name.split("/", 2);
    if (parts.length !== 2) {
        logger_1.helm.log("Chart should be of the form REPO/CHARTNAME");
        return undefined;
    }
    const hh = helmHome();
    const reposFile = filepath.join(hh, "repository", "repositories.yaml");
    if (!fs.existsSync(reposFile)) {
        vscode.window.showErrorMessage(`Helm repositories file ${reposFile} not found.`);
        return undefined;
    }
    const repos = YAML.load(reposFile);
    let req;
    repos.repositories.forEach((repo) => {
        if (repo.name === parts[0]) {
            const cache = YAML.load(repo.cache);
            _.each(cache.entries, (releases, name) => {
                if (name === parts[1]) {
                    req = new Requirement();
                    req.repository = repo.url;
                    req.name = name;
                    req.version = releases[0].version;
                    return;
                }
            });
            return;
        }
    });
    return req;
}
exports.searchForChart = searchForChart;
function helmHome() {
    const h = shell_1.shell.home();
    return process.env["HELM_HOME"] || filepath.join(h, '.helm');
}
exports.helmHome = helmHome;
//# sourceMappingURL=helm.exec.js.map