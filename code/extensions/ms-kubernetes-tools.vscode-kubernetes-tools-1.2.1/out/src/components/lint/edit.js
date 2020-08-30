"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const kp = require("k8s-manifest-parser");
const yaml = require("js-yaml");
const _ = require("lodash");
const never_1 = require("../../utils/never");
function merge(edit, document, parsedDocument, into, value) {
    const languageId = getLanguageId(document);
    if (!languageId) {
        return;
    }
    const intoNode = mapNodeOf(into);
    if (!intoNode) {
        return;
    }
    const fullRange = intoNode.range;
    const fullRangeInDoc = new vscode.Range(document.positionAt(fullRange.start), document.positionAt(fullRange.end)); // The range also picks up any leading spaces leading into the next array entry
    const fullRangeText = document.getText(fullRangeInDoc);
    const trailingSpaceCount = fullRangeText.length - fullRangeText.trimRight().length;
    const replaceRange = { start: fullRange.start, end: fullRange.end - trailingSpaceCount };
    const replaceRangeInDoc = new vscode.Range(document.positionAt(replaceRange.start), document.positionAt(replaceRange.end));
    const existing = Object.entries(intoNode.entries);
    const isEmpty = existing.length === 0;
    const newMap = _.merge({}, objectOf(intoNode.entries), value);
    const ancs = kp.evaluate(parsedDocument, {
        onMap: function* (value, ancestors) {
            if (value.range.start === intoNode.range.start && value.range.end === intoNode.range.end) {
                yield ancestors;
            }
        }
    })[0];
    const containmentKind = ancs ? ancs[0].kind : 'top-level';
    // We are at something of the form:
    //   - foo: bar        } # only from beginning of 'foo'
    //     baz: 123        }
    //     q:              }
    //       fie: curses   } # plus leading spaces on next line
    //   - foo: bar
    // OR
    // k:          # NOT part of what we get given
    //   foo: bar        } # from beginning of 'foo'
    //   baz: 123        }
    //   q:              }
    //     fie: curses   }
    // OR
    // - {}
    // OR
    // k: {}  # note the MapValue is ONLY the {} part
    // OR
    // foo: bar
    // baz: 123
    // q:
    //   fie: curses
    // case 1: replace is fine - indent by left of range and trim
    // case 2: replace is fine - indent by left of range and trim
    // case 3: replace is fine - indent by left of range and trim
    // case 4 (isEmpty && containmentKind === 'map'): need to add line break before, otherwise replace is fine - indent by left of key + 2 and DO NOT TRIM
    // case 5: replace is fine - indent by left of range and trim (this equates to no indent but saves a code path)
    // TODO: this is causing more reformatting than is really desirable: is there a way to avoid this?
    // (For each entry in the value, if it corresponds to an existing child node, recursively merge
    // that; otherwise insert it.)  (Or, perhaps simpler, though not as surgical: locate keys in the
    // existing map corresponding to the keys in 'value', and replace those sections only.)
    const isEmptyMap = isEmpty && containmentKind === 'map';
    if (languageId === 'yaml') {
        if (isEmptyMap) {
            const parentMap = ancs[0].value;
            const ourEntry = parentMap.entries[ancs[0].at];
            const indentAmount = document.positionAt(ourEntry.keyRange.start).character + 2;
            const indent = ' '.repeat(indentAmount);
            const basicYAML = yaml.safeDump(newMap);
            const indentedYAML = basicYAML.split('\n').map((l) => indent + l).join('\n');
            const newText = '\n' + indentedYAML.trim();
            edit.replace(document.uri, replaceRangeInDoc, newText);
        }
        else {
            const indentAmount = replaceRangeInDoc.start.character;
            const indent = ' '.repeat(indentAmount);
            const basicYAML = yaml.safeDump(newMap);
            const indentedYAML = basicYAML.split('\n').map((l) => indent + l).join('\n');
            const newText = indentedYAML.trim();
            edit.replace(document.uri, replaceRangeInDoc, newText);
        }
    }
    else if (languageId === 'json') {
        throw new Error("You haven't done this bit yet Towlson!");
    }
}
exports.merge = merge;
function objectOf(ast) {
    const o = {};
    for (const [k, v] of Object.entries(ast)) {
        o[k] = jsValueOfRME(v);
    }
    return o;
}
function jsValueOfRME(rme) {
    return jsValueOf(rme.value);
}
function jsValueOf(v) {
    switch (v.valueType) {
        case 'string': return v.value;
        case 'number': return v.value;
        case 'boolean': return v.value;
        case 'array': return v.items.map((item) => jsValueOf(item));
        case 'map': return objectOf(v.entries);
        case 'missing': return undefined;
        default: return never_1.cantHappen(v);
    }
}
function mapNodeOf(node) {
    if (isMapValue(node)) {
        return node;
    }
    if (isMapTraversalEntry(node)) {
        return node.parseNode();
    }
    return Object.assign({ valueType: 'map' }, node);
}
function isMapValue(node) {
    return node.valueType === 'map';
}
function isMapTraversalEntry(node) {
    return !!(node.parseNode);
}
// export function appendMapEntries(edit: vscode.WorkspaceEdit, document: vscode.TextDocument, map: kp.MapValue, content: { [key: string]: any }): void {
//     const languageId = getLanguageId(document);
//     if (!languageId) {
//         return;
//     }
//     const appendAfter = lastEntry(map);
//     if (!appendAfter) {
//         // the parent is of the form [YAML] foo: {} or - {}
//         //                           [JSON] "foo": {} or [ ... ,{}, ... ]
//         // TODO: we probably need to rewrite the map in the this case
//         if (languageId === 'yaml') {
//             // want to be
//             // foo:
//             //   e1: ...
//             // or
//             // - e1: ...
//         } else {
//             // want to be
//             // "foo": {
//             //   "e1": "..."
//             // }
//             // or
//             // [
//             //   {
//             //     "e1": "..."
//             //   }
//             // ]
//             // i.e. replace {<ws>} by {\n"e1": "..."\n}
//             // i.e. <ws> by \n...\n<indent>
//         }
//         return;  // TODO: what
//     }
//     const lastEntryPosition = document.positionAt(appendAfter.keyRange.start);  // WRONG! WRONG! WRONG!  (consider case where last entry has subentries)
//     const lastEntryLine = document.lineAt(lastEntryPosition.line);
//     const indentAmount = lastEntryLine.firstNonWhitespaceCharacterIndex;
//     const insertPosition = lastEntryLine.range.end;
//     if (languageId === 'yaml') {
//         const indent = ' '.repeat(indentAmount);
//         const basicYAML = yaml.safeDump(content);
//         const indentedYAML = basicYAML.split('\n').map((l) => indent + l).join('\n');
//         const newText = '\n' + indentedYAML.trimRight();
//         edit.insert(document.uri, insertPosition, newText);
//     } else {
//         const indent = ' '.repeat(indentAmount - 2);
//         const basicJSON = JSON.stringify(content, undefined, 2);
//         const jsonLines = basicJSON.split('\n');
//         const jsonEntries = jsonLines.slice(1, jsonLines.length - 1);
//         const indentedJSON = jsonEntries.map((l) => indent + l).join('\n');
//         const newText = ',\n' + indentedJSON.trimRight();
//         edit.insert(document.uri, insertPosition, newText);
//     }
// }
function getLanguageId(document) {
    switch (document.languageId) {
        case 'json':
        case 'yaml':
            return document.languageId;
        default:
            return undefined;
    }
}
// function lastEntry(map: kp.MapValue) {
//     let last: kp.ResourceMapEntry | undefined = undefined;
//     for (const [_key, value] of Object.entries(map.entries)) {
//         const position = value.keyRange.start;
//         if (!last || last.keyRange.start < position) {
//             last = value;
//         }
//     }
//     return last;
// }
//# sourceMappingURL=edit.js.map