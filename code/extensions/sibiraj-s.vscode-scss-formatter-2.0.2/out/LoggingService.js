"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const utils_1 = require("./utils");
class LoggingService {
    constructor(statusbarService) {
        this.outputChannel = vscode_1.window.createOutputChannel(utils_1.EXTENSION_NAME);
        this.statusbarService = statusbarService;
    }
    // add message to the output channel
    addToOutput(message) {
        const title = `${new Date().toLocaleString()}:`;
        // Create a sort of title, to differentiate between messages
        this.outputChannel.appendLine(title);
        this.outputChannel.appendLine('-'.repeat(title.length));
        // Append actual output
        this.outputChannel.appendLine(`${message}\n`);
    }
    registerDisposables() {
        return [
            vscode_1.commands.registerCommand('scss-formatter.open-output', () => {
                this.outputChannel.show();
            }),
            vscode_1.commands.registerCommand('scss-formatter.show-output', () => {
                this.outputChannel.show();
            }),
            vscode_1.commands.registerCommand('scss-formatter.clear-output', () => {
                this.outputChannel.clear();
                this.statusbarService.reset();
            })
        ];
    }
}
exports.default = LoggingService;
//# sourceMappingURL=LoggingService.js.map