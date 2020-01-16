"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function findParentYaml(document, line) {
    const indent = yamlIndentLevel(document.lineAt(line).text);
    while (line >= 0) {
        const txt = document.lineAt(line);
        if (yamlIndentLevel(txt.text) < indent) {
            return line;
        }
        line = line - 1;
    }
    return line;
}
exports.findParentYaml = findParentYaml;
function yamlIndentLevel(str) {
    let i = 0;
    while (true) {
        if (str.length <= i || !isYamlIndentChar(str.charAt(i))) {
            return i;
        }
        ++i;
    }
}
function isYamlIndentChar(ch) {
    return ch === ' ' || ch === '-';
}
//# sourceMappingURL=yaml-navigation.js.map