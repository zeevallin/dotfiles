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
const path = require("path");
const common_1 = require("./common");
const global_1 = require("../common/global");
class ResultView {
    constructor(webview, resource) {
        this._results = [];
        this._disposed = false;
        this.firstUpdate = true;
        this.forceUpdate = false;
        this.disposables = [];
        this._onDisposeEmitter = new vscode.EventEmitter();
        this.onDispose = this._onDisposeEmitter.event;
        this._onDidChangeViewStateEmitter = new vscode.EventEmitter();
        this.onDidChangeViewState = this._onDidChangeViewStateEmitter.event;
        this._resource = resource;
        this.editor = webview;
        this.editor.onDidDispose(() => this.dispose(), null, this.disposables);
        this.editor.onDidChangeViewState(e => this._onDidChangeViewStateEmitter.fire(e), null, this.disposables);
    }
    static revive(webview, state) {
        return __awaiter(this, void 0, void 0, function* () {
            const resource = vscode.Uri.parse(state.resource);
            const view = new ResultView(webview, resource);
            view.editor.webview.options = ResultView.getWebviewOptions(resource);
            view._results.push({
                command: 'ext-message',
                message: 'Please rerun your queries',
                rowCount: 0
            });
            yield view.doUpdate();
            return view;
        });
    }
    static create(resource, viewColumn) {
        const view = vscode.window.createWebviewPanel(ResultView.viewType, ResultView.getViewTitle(resource), viewColumn, Object.assign({ enableFindWidget: true }, ResultView.getWebviewOptions(resource)));
        return new ResultView(view, resource);
    }
    get resource() {
        return this._resource;
    }
    get state() {
        return {
            resource: this.resource.toString()
        };
    }
    get currentResults() {
        return this._results;
    }
    dispose() {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._onDisposeEmitter.fire();
        this._onDisposeEmitter.dispose();
        this._onDidChangeViewStateEmitter.dispose();
        this.editor.dispose();
        common_1.disposeAll(this.disposables);
    }
    update(resource, res) {
        clearTimeout(this.throttleTimer);
        this.throttleTimer = undefined;
        this._results = res;
        this._resource = resource;
        this.throttleTimer = setTimeout(() => this.doUpdate(), 300);
        this.firstUpdate = false;
    }
    refresh() {
        this.forceUpdate = true;
        this.update(this._resource, this._results);
    }
    matchesResource(otherResource) {
        return this.isResultsFor(otherResource);
    }
    matches(otherView) {
        return this.matchesResource(otherView._resource);
    }
    reveal(viewColumn) {
        this.editor.reveal(viewColumn, true);
    }
    isResultsFor(resource) {
        return this._resource.toString() === resource.toString();
    }
    static getViewTitle(resource) {
        return 'Results: ' + path.basename(resource.toString());
    }
    doUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            const resource = this._resource;
            const results = this._results;
            clearTimeout(this.throttleTimer);
            this.throttleTimer = undefined;
            this.forceUpdate = false;
            // build HTML for results
            let html = common_1.generateResultsHtml(resource, results, this.state);
            this.editor.title = ResultView.getViewTitle(resource);
            this.editor.webview.options = ResultView.getWebviewOptions(resource);
            this.editor.webview.html = html;
        });
    }
    static getWebviewOptions(resource) {
        let localRoot = vscode.Uri.file(global_1.Global.context.asAbsolutePath('media'));
        return {
            enableScripts: true,
            enableCommandUris: true,
            localResourceRoots: [
                localRoot
            ]
        };
    }
}
ResultView.viewType = 'vscode-postgres.results';
exports.ResultView = ResultView;
//# sourceMappingURL=resultView.js.map