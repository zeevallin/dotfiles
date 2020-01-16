"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function dummyToken() {
    return (new vscode.CancellationTokenSource()).token;
}
exports.dummyToken = dummyToken;
//# sourceMappingURL=cancellation.js.map