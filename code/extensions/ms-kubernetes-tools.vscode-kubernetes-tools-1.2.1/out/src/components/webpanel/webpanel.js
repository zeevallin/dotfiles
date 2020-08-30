"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class WebPanel {
    constructor(panel, content, resource, currentPanels) {
        this.panel = panel;
        this.disposables = [];
        this.content = content;
        this.resource = resource;
        this.update();
        this.panel.onDidDispose(() => this.dispose(currentPanels), null, this.disposables);
        this.panel.onDidChangeViewState(() => {
            if (this.panel.visible) {
                this.update();
            }
        }, null, this.disposables);
    }
    static createOrShowInternal(content, resource, viewType, title, currentPanels, fn) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        // If we already have a panel, show it.
        const currentPanel = currentPanels.get(resource);
        if (currentPanel) {
            currentPanel.setContent(content);
            currentPanel.panel.reveal(column);
            return currentPanel;
        }
        const panel = vscode.window.createWebviewPanel(viewType, title, column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            // And restrict the webview to only loading content from our extension's `media` directory.
            localResourceRoots: []
        });
        const result = fn(panel, content, resource);
        currentPanels.set(resource, result);
        return result;
    }
    setContent(content) {
        this.content = content;
        this.update();
    }
    dispose(currentPanels) {
        currentPanels.delete(this.resource);
        this.panel.dispose();
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}
exports.WebPanel = WebPanel;
//# sourceMappingURL=webpanel.js.map