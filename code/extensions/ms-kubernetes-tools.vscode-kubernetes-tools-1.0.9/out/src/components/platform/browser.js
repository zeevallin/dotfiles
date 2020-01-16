"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const opn = require("opn");
function open(url) {
    // This check may be redundant now?
    if (vscode.env.openExternal) {
        vscode.env.openExternal(vscode.Uri.parse(url));
    }
    else {
        opn(url);
    }
}
exports.open = open;
//# sourceMappingURL=browser.js.map