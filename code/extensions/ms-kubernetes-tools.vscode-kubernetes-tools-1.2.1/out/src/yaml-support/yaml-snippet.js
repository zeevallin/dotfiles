"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const fuzzysearch = require("fuzzysearch");
/**
 * A kubernetes completion provider provides yaml code snippets for kubernetes, eg: service, deployment.
 */
class KubernetesCompletionProvider {
    // default constructor
    constructor() {
        // storing all loaded yaml code snippets from ../../snippets folder
        this.snippets = [];
        this.loadCodeSnippets();
    }
    // provide code snippets for vscode
    provideCompletionItems(doc, pos) {
        const wordPos = doc.getWordRangeAtPosition(pos);
        const word = doc.getText(wordPos);
        return this.filterCodeSnippets(word).map((snippet) => {
            const item = new vscode.CompletionItem(snippet.label, vscode.CompletionItemKind.Snippet);
            item.insertText = new vscode.SnippetString(snippet.body);
            item.documentation = snippet.description;
            return item;
        });
    }
    // load yaml code snippets from ../../snippets folder
    loadCodeSnippets() {
        const snippetRoot = path.join(__dirname, '../../../snippets');
        this.snippets = fs.readdirSync(snippetRoot)
            .filter((filename) => filename.endsWith('.yaml'))
            .map((filename) => this.readYamlCodeSnippet(path.join(snippetRoot, filename)));
    }
    // filter all internal code snippets using the parameter word
    filterCodeSnippets(word) {
        return this.snippets.filter((snippet) => fuzzysearch(word.toLowerCase(), snippet.name.toLowerCase()));
    }
    // parse a yaml snippet file into a CodeSnippet
    readYamlCodeSnippet(filename) {
        return yaml.safeLoad(fs.readFileSync(filename, 'utf-8'));
    }
}
exports.KubernetesCompletionProvider = KubernetesCompletionProvider;
//# sourceMappingURL=yaml-snippet.js.map