"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function activate(context) {
    context.subscriptions.push(vscode.commands.registerTextEditorCommand("sort-lines-by-selection.sortLinesBySelection", (editor, edit, args) => {
        try {
            var { morph = null, case_sensitive = false } = args || {};
            run(editor, edit, getMorph(morph, case_sensitive));
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    }));
}
exports.activate = activate;
function getMorph(morph, caseSensitive) {
    var morphFunction = morph && compileMorph(morph) || (s => s);
    return caseSensitive ? morphFunction : s => morphFunction(s.toLowerCase());
}
function compileMorph(morph) {
    try {
        return eval("s => " + morph);
    }
    catch (e) {
        return null;
    }
}
function run(editor, edit, morph) {
    var selections = unique(sort(editor.selections.map(selection => getSelectionData(editor.document, selection, morph))));
    var texts = sortTexts(selections);
    for (var i = selections.length - 1; i >= 0; --i)
        edit.replace(selections[i].line, texts[i]);
}
function getSelectionData(document, selection, morph) {
    var line = lineFromSelection(document, selection);
    return {
        selection: selection,
        comparisonText: morph(document.getText(selection)),
        line: line,
        lineText: document.getText(line),
    };
}
function lineFromSelection(document, selection) {
    var pos = selection.start;
    var lineStart = pos.with({ character: 0 });
    var lineEnd = document.lineAt(pos).range.end;
    return new vscode.Range(lineStart, lineEnd);
}
function sort(selections) {
    return selections
        .slice() // clone
        .sort(function (a, b) {
        var aStart = a.line.start;
        var bStart = b.line.start;
        return aStart.compareTo(bStart);
    });
}
function unique(selections) {
    var unique = [];
    var prev = null;
    for (var selection of selections) {
        var current = selection.line.start;
        if (prev != null && current.isEqual(prev))
            continue;
        unique.push(selection);
        prev = current;
    }
    return unique;
}
function sortTexts(selections) {
    return selections
        .slice() // clone
        .sort((a, b) => compare(a.comparisonText, b.comparisonText))
        .map(selection => selection.lineText);
}
function compare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
//# sourceMappingURL=extension.js.map