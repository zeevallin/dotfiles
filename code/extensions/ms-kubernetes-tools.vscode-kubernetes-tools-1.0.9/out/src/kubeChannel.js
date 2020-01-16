"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class KubeChannel {
    constructor() {
        this.channel = vscode.window.createOutputChannel("Kubernetes");
    }
    showOutput(message, title) {
        if (title) {
            const simplifiedTime = (new Date()).toISOString().replace(/z|t/gi, ' ').trim(); // YYYY-MM-DD HH:mm:ss.sss
            const hightlightingTitle = `[${title} ${simplifiedTime}]`;
            this.channel.appendLine(hightlightingTitle);
        }
        this.channel.appendLine(message);
        this.channel.show();
    }
}
exports.kubeChannel = new KubeChannel();
//# sourceMappingURL=kubeChannel.js.map