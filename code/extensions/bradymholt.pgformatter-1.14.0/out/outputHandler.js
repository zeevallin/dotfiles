"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
let outputChannel;
/**
 * Append messages to the output channel and format it with a title
 *
 * @param message The message to append to the output channel
 */
function addToOutput(message) {
    if (!outputChannel) {
        return;
    }
    const title = `${new Date().toLocaleString()}:`;
    // Create a sort of title, to differentiate between messages
    outputChannel.appendLine(title);
    outputChannel.appendLine("-".repeat(title.length));
    // Append actual output
    outputChannel.appendLine(`${message}\n`);
}
exports.addToOutput = addToOutput;
/**
 * Setup the output channel
 * Create a command to show the output channel
 *
 * @returns {Disposable} The command to open the output channel
 */
function setupOutputHandler() {
    // Setup the outputChannel
    outputChannel = vscode_1.window.createOutputChannel("pgFormatter");
    return vscode_1.commands.registerCommand("pgFormatter.open-output", () => {
        outputChannel.show();
    });
}
exports.setupOutputHandler = setupOutputHandler;
//# sourceMappingURL=outputHandler.js.map