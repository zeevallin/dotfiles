"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dictionary_1 = require("./utils/dictionary");
/**
 * Parse column based output which is seperated by whitespace(s) from kubectl or similar sources
 * for example, kubectl get po
 * @param lineOutput raw output with headers from kubectl or similar sources
 * @param columnSeparator a regex for the column separators
 * @return array of objects with key as column header and value
 */
function parseLineOutput(lineOutput, columnSeparator) {
    const headers = lineOutput.shift();
    if (!headers) {
        return [];
    }
    const parsedHeaders = headers.toLowerCase().replace(columnSeparator, '|').split('|');
    return lineOutput.map((line) => {
        const lineInfoObject = dictionary_1.Dictionary.of();
        const bits = line.replace(columnSeparator, '|').split('|');
        bits.forEach((columnValue, index) => {
            lineInfoObject[parsedHeaders[index].trim()] = columnValue.trim();
        });
        return lineInfoObject;
    });
}
exports.parseLineOutput = parseLineOutput;
//# sourceMappingURL=outputUtils.js.map