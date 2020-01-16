"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class HelmRequirementsCodeLensProvider {
    provideCodeLenses(doc, _token) {
        if (!doc.fileName.endsWith("requirements.yaml")) {
            return [];
        }
        // Find the dependencies section
        const i = doc.getText().indexOf("dependencies:");
        const start = doc.positionAt(i);
        const range = doc.getWordRangeAtPosition(start);
        if (!range || range.isEmpty) {
            return [];
        }
        const update = new vscode.CodeLens(range, {
            title: "update dependencies",
            command: "extension.helmDepUp",
            arguments: [doc]
        });
        const insert = new vscode.CodeLens(range, {
            title: "insert dependency",
            command: "extension.helmInsertReq",
        });
        return [update, insert];
    }
}
exports.HelmRequirementsCodeLensProvider = HelmRequirementsCodeLensProvider;
//# sourceMappingURL=helm.requirementsCodeLens.js.map