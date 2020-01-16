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
const resultView_1 = require("./resultView");
const common_1 = require("./common");
class ResultsManager {
    constructor() {
        this._results = [];
        this._activeResults = undefined;
        this._disposables = [];
        this._disposables.push(vscode.window.registerWebviewPanelSerializer(resultView_1.ResultView.viewType, this));
    }
    dispose() {
        common_1.disposeAll(this._disposables);
        common_1.disposeAll(this._results);
    }
    refresh() {
        for (const view of this._results) {
            view.refresh();
        }
    }
    showResults(resource, viewColumn, res) {
        let view = this.getExistingView(resource);
        if (view) {
            view.reveal(viewColumn);
        }
        else {
            view = this.createNewView(resource, viewColumn);
        }
        view.update(resource, res);
    }
    get activeWinResults() {
        if (!this._activeResults)
            return null;
        return this._activeResults.currentResults;
    }
    deserializeWebviewPanel(webview, state) {
        return __awaiter(this, void 0, void 0, function* () {
            const view = yield resultView_1.ResultView.revive(webview, state);
            this.registerView(view);
        });
    }
    getExistingView(resource) {
        return this._results.find(view => {
            return view.matchesResource(resource);
        });
    }
    createNewView(resource, viewColumn) {
        const view = resultView_1.ResultView.create(resource, viewColumn);
        this._activeResults = view;
        return this.registerView(view);
    }
    registerView(view) {
        this._results.push(view);
        view.onDispose(() => {
            const existing = this._results.indexOf(view);
            if (existing === -1)
                return;
            this._results.splice(existing, 1);
            if (this._activeResults === view) {
                this._activeResults = undefined;
            }
        });
        view.onDidChangeViewState(({ webviewPanel }) => {
            common_1.disposeAll(this._results.filter(otherView => view !== otherView && view.matches(otherView)));
            vscode.commands.executeCommand('setContext', ResultsManager.pgsqlResultContextKey, webviewPanel.visible && webviewPanel.active);
            this._activeResults = webviewPanel.active ? view : undefined;
        });
        return view;
    }
}
ResultsManager.pgsqlResultContextKey = 'vscodePostgresResultFocus';
exports.ResultsManager = ResultsManager;
//# sourceMappingURL=resultsManager.js.map