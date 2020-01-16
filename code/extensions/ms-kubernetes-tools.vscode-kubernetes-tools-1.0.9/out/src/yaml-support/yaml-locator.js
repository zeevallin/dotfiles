"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_yaml_parser_1 = require("node-yaml-parser");
function isMapping(node) {
    return node.kind === 'MAPPING';
}
exports.isMapping = isMapping;
function isSequence(node) {
    return node.kind === 'SEQ';
}
exports.isSequence = isSequence;
function isMappingItem(node) {
    return node.kind === 'PAIR';
}
exports.isMappingItem = isMappingItem;
/**
 * A yaml interpreter parse the yaml text and find the matched ast node from vscode location.
 */
class YamlLocator {
    constructor() {
        // a mapping of URIs to cached documents
        this.cache = {};
    }
    /**
     * Parse the yaml text and find the best node&document for the given position.
     *
     * @param {vscode.TextDocument} textDocument vscode text document
     * @param {vscode.Position} pos vscode position
     * @returns {YamlMatchedElement} the search results of yaml elements at the given position
     */
    getMatchedElement(textDocument, pos) {
        const key = textDocument.uri.toString();
        this.ensureCache(key, textDocument);
        const cacheEntry = this.cache[key];
        // findNodeAtPosition will find the matched node at given position
        return node_yaml_parser_1.findNodeAtPosition(cacheEntry.yamlDocs, cacheEntry.lineLengths, pos.line, pos.character);
    }
    /**
     * Parse the yaml text and find the best node&document for the given position.
     *
     * @param {vscode.TextDocument} textDocument vscode text document
     * @param {vscode.Position} pos vscode position
     * @returns {YamlMatchedElement} the search results of yaml elements at the given position
     */
    getYamlDocuments(textDocument) {
        const key = textDocument.uri.toString();
        this.ensureCache(key, textDocument);
        return this.cache[key].yamlDocs;
    }
    ensureCache(key, textDocument) {
        if (!this.cache[key]) {
            this.cache[key] = { version: -1 };
        }
        if (this.cache[key].version !== textDocument.version) {
            // the document and line lengths from parse method is cached into YamlCachedDocuments to avoid duplicate
            // parse against the same text.
            const { documents, lineLengths } = node_yaml_parser_1.parse(textDocument.getText());
            this.cache[key].yamlDocs = documents;
            this.cache[key].lineLengths = lineLengths;
            this.cache[key].version = textDocument.version;
        }
    }
}
exports.YamlLocator = YamlLocator;
// a global instance of yaml locator
const yamlLocator = new YamlLocator();
exports.yamlLocator = yamlLocator;
//# sourceMappingURL=yaml-locator.js.map