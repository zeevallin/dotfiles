"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const helm_funcmap_1 = require("./helm.funcmap");
const helm_resources_1 = require("./helm.resources");
const yaml_util_1 = require("./yaml-support/yaml-util");
// Provide hover support
class HelmTemplateHoverProvider {
    constructor() {
        const fm = new helm_funcmap_1.FuncMap();
        const rs = new helm_resources_1.Resources();
        this.funcmap = fm.all();
        this.valmap = fm.helmVals();
        this.resmap = rs.all();
    }
    provideHover(doc, pos, _token) {
        const wordRange = doc.getWordRangeAtPosition(pos);
        const word = wordRange ? doc.getText(wordRange) : "";
        if (word === "") {
            return Promise.resolve(null);
        }
        if (this.inActionVal(doc, pos, word)) {
            const found = this.findVal(word);
            if (found) {
                return new vscode.Hover(found, wordRange);
            }
        }
        if (this.inAction(doc, pos, word)) {
            const found = this.findFunc(word);
            if (found) {
                return new vscode.Hover(found, wordRange);
            }
        }
        if (this.notInAction(doc, pos, word)) {
            try {
                // when the word is in value position, it should not pop up hovers, for example,
                // the following yaml should not show pop up window for 'metadata'
                // selector:
                //  app: metadata
                if (!yaml_util_1.isPositionInKey(doc, pos)) {
                    return undefined;
                }
            }
            catch (ex) {
                // ignore since the editing yaml may not be able to parse
            }
            const found = this.findResourceDef(word);
            if (found) {
                return new vscode.Hover(found, wordRange);
            }
        }
        return Promise.resolve(null);
    }
    inAction(doc, pos, word) {
        const lineText = doc.lineAt(pos.line).text;
        const r = new RegExp(`{{[^}]*[\\s\\(|]?(${word})\\s[^{]*}}`);
        return r.test(lineText);
    }
    notInAction(doc, pos, word) {
        const lineText = doc.lineAt(pos.line).text;
        const r = new RegExp(`(^|})[^{]*(${word})`);
        return r.test(lineText);
    }
    findFunc(word) {
        for (const item of this.funcmap) {
            if (item.label === word) {
                return [{ language: "helm", value: `{{ ${item.detail} }}` }, `${item.documentation}`];
            }
        }
        return [];
    }
    inActionVal(doc, pos, word) {
        const lineText = doc.lineAt(pos.line).text;
        const r = new RegExp(`{{[^}]*\\.(${word})[\\.\\s]?[^{]*}}`);
        return r.test(lineText);
    }
    findVal(word) {
        for (const item of this.valmap) {
            if (item.label === word) {
                return [{ language: "helm", value: `{{ ${item.detail} }}` }, `${item.documentation}`];
            }
        }
        return [];
    }
    findResourceDef(word) {
        for (const item of this.resmap) {
            if (item.label === word) {
                return [{ language: "helm", value: `${item.detail}` }, `${item.documentation}`];
            }
        }
        return [];
    }
}
exports.HelmTemplateHoverProvider = HelmTemplateHoverProvider;
//# sourceMappingURL=helm.hoverProvider.js.map