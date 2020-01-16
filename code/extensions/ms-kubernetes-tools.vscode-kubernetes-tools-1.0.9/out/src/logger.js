"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const HELM_CHANNEL = "Helm";
// LoggingConsole provides a log-like facility for sending messages to a shared output channel.
//
// A console is disposable, since it allocates a channel.
class LoggingConsole {
    constructor(channelName) {
        this.channel = vscode.window.createOutputChannel(channelName);
    }
    log(msg) {
        this.channel.append(msg);
        this.channel.append("\n");
        this.channel.show(true);
    }
    dispose() {
        this.channel.dispose();
    }
}
exports.helm = new LoggingConsole(HELM_CHANNEL);
//# sourceMappingURL=logger.js.map