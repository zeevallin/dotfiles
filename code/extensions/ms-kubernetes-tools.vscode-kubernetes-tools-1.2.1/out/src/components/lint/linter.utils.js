"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function symbolContains(outer, inner) {
    return outer.location.range.contains(inner.location.range); // don't worry about URI
}
exports.symbolContains = symbolContains;
function childSymbols(allSymbols, parent, name) {
    return allSymbols.filter((s) => s.name === name && s.containerName === `${parent.containerName}.${parent.name}` && symbolContains(parent, s));
}
exports.childSymbols = childSymbols;
function warningOn(symbol, text) {
    return new vscode.Diagnostic(symbol.location.range, text, vscode.DiagnosticSeverity.Warning);
}
exports.warningOn = warningOn;
//# sourceMappingURL=linter.utils.js.map